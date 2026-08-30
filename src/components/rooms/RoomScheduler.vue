<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { reservationService } from '@/services/reservationService'
import { roomService } from "@/services/roomService.ts"
import type { Reservation } from '@/types/reservations'
import {
  buildDateTimeString,
  findOverlappingReservation,
  formatBoundaryTime,
  parseTimeFromIso,
  reservationEndMinutes,
  timeToMinutes,
} from '@/utils/roomSchedulerTime'

const props = defineProps<{
  roomId: number
}>()

const emit = defineEmits(['booking-success'])
const { t } = useI18n()

const START_HOUR = 8
const END_HOUR = 24

const getAmsterdamDateString = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date())
const selectedDate = ref(getAmsterdamDateString())
const minDate = computed(() => getAmsterdamDateString())

const getAmsterdamCurrentTime = (): string => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date())
}

const reservations = ref<Reservation[]>([])
const weeklyScheduleCache = ref<any[]>([])
const activePolicies = ref<{ start: string; end: string; max_days: number }[]>([])
const selectedSlots = ref<string[]>([])
const reservationName = ref('')
const shareName = ref<boolean>(true)

const isLoading = ref(false)
const isSubmitting = ref(false)
const feedbackMessage = ref<string | null>(null)
const isError = ref(false)

const timeSlots = computed(() => {
  const slots: string[] = []
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    const hh = String(hour).padStart(2, '0')
    slots.push(`${hh}:00`, `${hh}:30`)
  }
  return slots
})

const getMatchingPolicyEntry = (slotTime: string): any | null => {
  if (!activePolicies.value || activePolicies.value.length === 0) return null

  const [slotHours = 0, slotMinutes = 0] = slotTime.split(':').map(Number)
  const slotStartInMinutes = slotHours * 60 + slotMinutes
  const slotEndInMinutes = slotStartInMinutes + 30

  return activePolicies.value.find(policy => {
    const cleanStart = policy.start.substring(0, 5)
    const cleanEnd = policy.end.substring(0, 5)

    const [startH = 0, startM = 0] = cleanStart.split(':').map(Number)
    const policyStartInMinutes = startH * 60 + startM

    const [endH = 0, endM = 0] = cleanEnd.split(':').map(Number)
    const policyEndInMinutes = endH * 60 + endM

    return slotStartInMinutes >= policyStartInMinutes && slotEndInMinutes <= policyEndInMinutes
  }) || null
}

const condensedTimeline = computed(() => {
  const timeline: any[] = []
  const rawSlots = [...timeSlots.value]
  const todayStr = getAmsterdamDateString()
  const currentTimeStr = getAmsterdamCurrentTime()

  const mappedSlots = rawSlots.reduce((acc: any, slotTime) => {
    const booking = findOverlappingReservation(reservations.value, timeToMinutes(slotTime))

    if (booking) {
      acc[slotTime] = {
        status: 'occupied',
        booking: {
          name: shareName.value ? booking.name : t('reservations.private_allocation'),
          endMinutes: reservationEndMinutes(booking.end_at),
          organisation: shareName.value ? booking.organisation : null
        }
      }
    } else {
      const policyEntry = getMatchingPolicyEntry(slotTime)

      let isPastMaxDays = false
      if (policyEntry && policyEntry.max_days) {
        const today = new Date(todayStr)
        const selected = new Date(selectedDate.value)
        const diffTime = selected.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > policyEntry.max_days) {
          isPastMaxDays = true
        }
      }

      if (selectedDate.value === todayStr) {
        if (slotTime < currentTimeStr) {
          acc[slotTime] = { status: 'past_slot' }
        } else {
          acc[slotTime] = { status: (policyEntry && !isPastMaxDays) ? 'available' : 'locked' }
        }
      } else {
        acc[slotTime] = { status: (policyEntry && !isPastMaxDays) ? 'available' : 'locked' }
      }
    }
    return acc
  }, {})

  for (let i = 0; i < rawSlots.length; i++) {
    const slotTime = rawSlots[i] ?? ''
    const current = mappedSlots[slotTime]

    if (!current) continue

    if (current.status === 'occupied') {
      const endMinutes = current.booking.endMinutes
      timeline.push({
        time: slotTime,
        status: 'occupied',
        booking: {
          name: current.booking.name,
          time_range: `${slotTime} - ${formatBoundaryTime(endMinutes)}`,
          organisation: current.booking.organisation
        }
      })

      while (i + 1 < rawSlots.length && timeToMinutes(rawSlots[i + 1] ?? '') < endMinutes) {
        i++
        timeline.push({ time: rawSlots[i], status: 'hidden_by_span' })
      }
      continue
    }

    if (current.status === 'past_slot') {
      const blockStart = slotTime
      while (i + 1 < rawSlots.length && mappedSlots[rawSlots[i + 1] ?? '']?.status === 'past_slot') {
        i++
        timeline.push({ time: rawSlots[i], status: 'hidden_by_span' })
      }
      const lastPastSlot = rawSlots[i] ?? ''
      const [lastH = 0, lastM = 0] = lastPastSlot.split(':').map(Number)
      const totalMin = lastH * 60 + lastM + 30
      const blockEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`

      timeline.push({
        time: blockStart,
        status: 'past_slot_condensed',
        time_range: `${blockStart} - ${blockEnd}`
      })
      continue
    }

    if (current.status === 'locked') {
      const blockStart = slotTime

      while (i + 1 < rawSlots.length && mappedSlots[rawSlots[i + 1] ?? '']?.status === 'locked') {
        i++
        timeline.push({ time: rawSlots[i], status: 'hidden_by_span' })
      }

      const lastLockedSlot = rawSlots[i] ?? ''
      const [lastH = 0, lastM = 0] = lastLockedSlot.split(':').map(Number)
      const totalMin = lastH * 60 + lastM + 30
      const blockEnd = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`

      timeline.push({
        time: blockStart,
        status: 'locked_condensed',
        time_range: `${blockStart} - ${blockEnd}`
      })
      continue
    }

    timeline.push({
      time: slotTime,
      status: 'available'
    })
  }

  return timeline
})

const syncActivePolicies = () => {
  let dayData = weeklyScheduleCache.value.find((day: any) => day.date === selectedDate.value)

  if (!dayData) {
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Europe/Amsterdam' })
        .format(new Date(selectedDate.value))
    dayData = weeklyScheduleCache.value.find((day: any) => day.day_name === dayName)
  }

  activePolicies.value = dayData ? dayData.entries : []
}

const fetchInitialData = async () => {
  try {
    isLoading.value = true
    feedbackMessage.value = null
    selectedSlots.value = []

    const policyResponse = await roomService.getWeeklySchedule(props.roomId)
    weeklyScheduleCache.value = policyResponse.data || []

    syncActivePolicies()
    await fetchDateReservations()
  } catch (err) {
    console.error("Failed loading initial scheduler data structures:", err)
  } finally {
    isLoading.value = false
  }
}

const fetchDateReservations = async () => {
  try {
    // The API scopes to this exact day server-side now (it used to return a
    // flat "next 15 upcoming reservations for the room" with no date filter
    // at all, so any reservation past the 15th upcoming one for a busy room
    // silently never reached this filter, regardless of which date was
    // selected). Still guard on status client-side too, cheaply.
    const resResponse = await roomService.getReservations(props.roomId, selectedDate.value)
    reservations.value = resResponse.data.filter((res: Reservation) =>
        res.status !== 'CANCELLED' && res.status !== 'REJECTED'
    )
  } catch (err) {
    console.error("Failed syncing room reservation boundaries:", err)
  }
}

watch(selectedDate, async () => {
  selectedSlots.value = []
  syncActivePolicies()

  isLoading.value = true
  await fetchDateReservations()
  isLoading.value = false
})

onMounted(fetchInitialData)

const toggleSlotSelection = (slotTime: string) => {
  const currentSlotState = condensedTimeline.value.find(s => s.time === slotTime)
  if (!currentSlotState || currentSlotState.status !== 'available') return

  if (selectedSlots.value.length === 0) {
    selectedSlots.value = [slotTime]
    return
  }

  const sortedAvailable = [...timeSlots.value]
  const clickedIndex = sortedAvailable.indexOf(slotTime)

  const selectedIndexes = selectedSlots.value.map(s => sortedAvailable.indexOf(s))
  const firstIndex = Math.min(...selectedIndexes)
  const lastIndex = Math.max(...selectedIndexes)

  if (selectedSlots.value.includes(slotTime)) {
    if (selectedSlots.value.length === 1) {
      selectedSlots.value = []
    } else if (clickedIndex === firstIndex) {
      selectedSlots.value = sortedAvailable.slice(firstIndex + 1, lastIndex + 1)
    } else {
      selectedSlots.value = sortedAvailable.slice(firstIndex, clickedIndex)
    }
    return
  }

  const newFirst = Math.min(firstIndex, clickedIndex)
  const newLast = Math.max(lastIndex, clickedIndex)
  const targetSpan = sortedAvailable.slice(newFirst, newLast + 1)

  const hasCollision = targetSpan.some(slot => {
    const state = condensedTimeline.value.find(s => s.time === slot)
    return !state || state.status !== 'available'
  })

  if (hasCollision) {
    selectedSlots.value = [slotTime]
  } else {
    selectedSlots.value = targetSpan
  }
}

const computedTimeBounds = computed(() => {
  if (selectedSlots.value.length === 0) return null

  const firstSlot = selectedSlots.value[0] ?? ''
  const lastSlot = selectedSlots.value[selectedSlots.value.length - 1] ?? ''

  if (!firstSlot || !lastSlot) return null

  const endMinutes = timeToMinutes(lastSlot) + 30

  return {
    start_at: buildDateTimeString(selectedDate.value, timeToMinutes(firstSlot)),
    end_at: buildDateTimeString(selectedDate.value, endMinutes),
    displayStart: firstSlot,
    displayEnd: formatBoundaryTime(endMinutes)
  }
})

const handleBookingSubmit = async () => {
  if (!computedTimeBounds.value || !reservationName.value.trim()) return

  try {
    isSubmitting.value = true
    isError.value = false
    feedbackMessage.value = null

    await reservationService.createReservation({
      room_id: props.roomId,
      name: reservationName.value.trim(),
      start_at: computedTimeBounds.value.start_at,
      end_at: computedTimeBounds.value.end_at,
      share_name: shareName.value
    })

    feedbackMessage.value = t('reservations.success_message')
    selectedSlots.value = []
    reservationName.value = ''

    await fetchDateReservations()
    emit('booking-success')

  } catch (err: any) {
    isError.value = true
    feedbackMessage.value = err.response?.data?.message || t('room_scheduler.error_fallback')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-white border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b] max-w-xl mx-auto">
    <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-100 pb-4 mb-4 gap-2">
      <div>
        <h3 class="text-base font-black text-haven-blue uppercase tracking-wider">{{ $t('room_scheduler.title') }}</h3>
        <p class="text-xs text-slate-500 font-medium">{{ $t('room_scheduler.subtitle') }}</p>
      </div>
      <input
          v-model="selectedDate"
          type="date"
          :min="minDate"
          class="border-2 border-haven-blue rounded-xl px-3 py-1.5 text-xs font-black focus:outline-none bg-slate-50"
      />
    </div>

    <div v-if="isLoading" class="text-center py-12 text-xs font-bold text-slate-400 uppercase tracking-widest">
      {{ $t('general.loading') }}
    </div>

    <div v-else class="space-y-2 max-h-85 overflow-y-auto pr-1">
      <template v-for="slot in condensedTimeline" :key="slot.time">

        <div v-if="slot.status === 'occupied'"
             class="bg-haven-blue text-white p-4 rounded-xl border-2 border-haven-blue">
          <div class="flex justify-between text-[10px] font-black text-white/70">
            <span>⏰ {{ slot.booking.time_range }}</span>
            <span class="text-pink-300 uppercase">🔒 {{ $t('room_scheduler.occupied') }}</span>
          </div>
          <div class="text-xs font-black mt-1">{{ slot.booking.name }}</div>
          <div v-if="slot.booking.organisation" class="text-[10px] text-white/60 font-bold mt-0.5">
            🏢 {{ slot.booking.organisation }}
          </div>
        </div>

        <div
            v-else-if="slot.status === 'past_slot_condensed'"
            class="bg-slate-50 border-2 border-slate-100 text-slate-400 p-3 rounded-xl flex items-center justify-between opacity-50 select-none"
        >
          <span class="text-xs font-bold tracking-wide">⌛ {{ $t('room_scheduler.past_slot') }}</span>
          <span class="text-[10px] font-mono font-black bg-slate-200/40 px-2 py-1 rounded-md text-slate-400">
            {{ slot.time_range }}
          </span>
        </div>

        <div
            v-else-if="slot.status === 'locked_condensed'"
            class="bg-slate-50 border-2 border-slate-200 text-slate-400 p-3 rounded-xl flex items-center justify-between opacity-70"
        >
          <span class="text-xs font-bold tracking-wide">🔒 {{ $t('room_scheduler.policy_restricted') }}</span>
          <span class="text-[10px] font-mono font-black bg-slate-200/60 px-2 py-1 rounded-md text-slate-500">
            {{ slot.time_range }}
          </span>
        </div>

        <div v-else-if="slot.status === 'hidden_by_span'" class="hidden"></div>

        <div
            v-else
            @click="toggleSlotSelection(slot.time)"
            class="flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer select-none"
            :class="[
            selectedSlots.includes(slot.time)
              ? 'bg-haven-blue/10 border-haven-blue text-haven-blue font-black scale-[0.99]'
              : 'bg-white border-slate-200 text-slate-700 font-bold hover:border-haven-blue'
          ]"
        >
          <span class="text-xs font-mono tracking-wide">{{ slot.time }}</span>
          <span
              class="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md text-haven-blue bg-haven-blue/5">
            {{ selectedSlots.includes(slot.time) ? $t('room_scheduler.selected') : $t('room_scheduler.available') }}
          </span>
        </div>

      </template>
    </div>

    <div v-if="computedTimeBounds && !isLoading" class="mt-6 pt-4 border-t-2 border-slate-100 space-y-4">
      <div>
        <label class="block text-xs font-black uppercase text-haven-blue/70 mb-1">{{
            $t('room_scheduler.name_label')
          }}</label>
        <input
            v-model="reservationName"
            type="text"
            :placeholder="$t('room_scheduler.placeholder_name')"
            class="w-full border-2 border-haven-blue rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:bg-slate-50"
        />
      </div>

      <div
          class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 flex justify-between items-center">
        <span>{{ $t('room_scheduler.selected_block_label') }}</span>
        <span class="text-haven-blue font-black bg-white px-2 py-1 border rounded-lg shadow-sm">
          ⏰ {{ computedTimeBounds.displayStart }} - {{ computedTimeBounds.displayEnd }}
        </span>
      </div>

      <div class="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div class="flex items-start gap-3">
          <div class="flex items-center h-5">
            <input
                id="share_name"
                v-model="shareName"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-haven-blue focus:ring-haven-blue accent-haven-blue cursor-pointer"
            />
          </div>
          <div class="text-xs">
            <label for="share_name" class="font-bold text-haven-blue cursor-pointer select-none">
              {{ $t('room_scheduler.share_name_label') }}
            </label>
            <p class="text-slate-500 font-medium mt-0.5">
              {{ $t('room_scheduler.share_name_description') }}
            </p>
          </div>
        </div>
      </div>

      <button
          @click="handleBookingSubmit"
          :disabled="isSubmitting || !reservationName.trim()"
          class="w-full py-3 bg-haven-blue text-white text-xs font-black uppercase tracking-widest rounded-xl border-2 border-haven-blue shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {{ isSubmitting ? $t('room_scheduler.btn_submitting') : $t('room_scheduler.btn_confirm') }}
      </button>
    </div>

    <div
        v-if="feedbackMessage"
        class="mt-4 p-3 rounded-xl border-2 text-xs font-bold text-center"
        :class="isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'"
    >
      {{ feedbackMessage }}
    </div>
  </div>
</template>