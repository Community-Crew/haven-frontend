<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {roomService} from '@/services/roomService'
import RoomScheduler from '@/components/rooms/RoomScheduler.vue'
import AppLayout from "@/layouts/AppLayout.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const route = useRoute()
const router = useRouter()

const roomSpec = ref<any>(null)
const weeklySchedule = ref<any>(null)

const isLoading = ref(true)
const fetchError = ref<string | null>(null)

onMounted(async () => {
  try {
    isLoading.value = true
    fetchError.value = null

    const roomSlug = route.params.slug as string

    const roomRes = await roomService.getRoom(roomSlug)
    roomSpec.value = roomRes.data

    const roomId = roomRes.data.id || roomRes.data.roomId

    const scheduleRes = await roomService.getWeeklySchedule(roomId)
    weeklySchedule.value = scheduleRes.data

  } catch (err: any) {
    console.error("Failed loading target room specifications:", err)
    fetchError.value = t('rooms.not_found')
  } finally {
    isLoading.value = false
  }
})

const handleBookingSuccess = () => {
  console.log('Room view refreshed on successful booking registration!')
}

const handleBackClick = () => {
  router.push({name: 'rooms.index'})
}
</script>

<template>
  <AppLayout>
    <div class="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <button
          @click="handleBackClick"
          class="text-xs font-black uppercase text-haven-blue/70 hover:text-haven-blue transition-colors flex items-center gap-1 cursor-pointer"
      >
         {{ $t('general.back') }}
      </button>

      <div v-if="isLoading"
           class="text-center py-24 text-xs font-bold uppercase text-slate-400 tracking-widest animate-pulse">
        {{ $t('general.loading') }}
      </div>

      <div v-else-if="fetchError"
           class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <p class="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">{{ fetchError }}</p>
        <button
            @click="handleBackClick"
            class="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-700"
        >
          {{ $t('general.return') }}
        </button>
      </div>

      <div v-else-if="roomSpec" class="grid lg:grid-cols-3 gap-8 items-start">

        <div class="lg:col-span-1 bg-white space-y-4 border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b]">
          <div>
          <span class="text-[10px] font-black uppercase bg-haven-blue/10 text-haven-blue px-2 py-1 rounded-md">
            {{ $t('rooms.label')}}
          </span>
            <h1 class="text-2xl font-black text-haven-blue uppercase tracking-tight mt-2">
              {{ roomSpec.name }}
            </h1>
          </div>

          <div class="border-t border-b border-slate-100 py-3 space-y-2">
            <div class="flex justify-between items-center text-xs font-medium text-slate-500">
              <span> {{ $t('rooms.location') }} </span>
              <span class="font-black text-slate-800">{{ roomSpec.location ?? 'Main Floor' }}</span>
            </div>
          </div>

          <div>
            <h4 class="text-xs font-black uppercase text-slate-400 tracking-wide mb-1">{{ $t('rooms.location')}}</h4>
            <p class="text-xs text-slate-600 leading-relaxed font-medium">
              {{
                roomSpec.description
              }}
            </p>
          </div>
        </div>

        <div class="lg:col-span-2">
          <RoomScheduler
              :room-id="roomSpec.id"
              @booking-success="handleBookingSuccess"
          />
        </div>

      </div>
    </div>
  </AppLayout>
</template>