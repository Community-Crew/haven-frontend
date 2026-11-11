<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { reservationService } from "@/services/reservationService.ts";
import type { MissedPhotosReservation } from "@/types/reservations.ts";

// AppLayout (and so this) remounts on every page, so only ask the API once
// per app session - once dismissed, the backend stops returning them anyway.
let checkedThisSession = false

const reservations = ref<MissedPhotosReservation[]>([])
const isDismissing = ref(false)

onMounted(async () => {
  if (checkedThisSession) return
  checkedThisSession = true

  try {
    reservations.value = await reservationService.getMissedPhotos()
  } catch {
    // Not worth bothering the resident about - it'll be asked again next session.
    checkedThisSession = false
  }
})

const missingLabelKey = (missing: MissedPhotosReservation['missing']) => {
  if (missing.length === 2) return 'reservations.checks.missed_modal.missing_both'
  return missing[0] === 'check_in'
      ? 'reservations.checks.missed_modal.missing_check_in'
      : 'reservations.checks.missed_modal.missing_check_out'
}

const formatDate = (value: string) => new Date(value).toLocaleString([], {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Amsterdam',
})

const dismiss = async () => {
  isDismissing.value = true
  try {
    await reservationService.acknowledgeMissedPhotos(reservations.value.map(reservation => reservation.id))
  } catch {
    // Close anyway; it'll just show again next session.
  } finally {
    reservations.value = []
    isDismissing.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
        v-if="reservations.length"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
        <h3 class="text-base font-black text-slate-800 dark:text-slate-100">
          📷 {{ $t('reservations.checks.missed_modal.title') }}
        </h3>

        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ $t('reservations.checks.missed_modal.description') }}
        </p>

        <ul class="space-y-2 max-h-64 overflow-y-auto">
          <li
              v-for="reservation in reservations"
              :key="reservation.id"
              class="rounded-xl bg-slate-100 dark:bg-white/5 px-3 py-2"
          >
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {{ reservation.room_name ?? reservation.name }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ formatDate(reservation.start_at) }}
            </p>
            <p class="text-xs font-bold text-haven-red">
              {{ $t(missingLabelKey(reservation.missing)) }}
            </p>
          </li>
        </ul>

        <div class="flex justify-end">
          <button
              type="button"
              class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue cursor-pointer active:scale-95 disabled:opacity-50"
              :disabled="isDismissing"
              @click="dismiss"
          >
            {{ $t('reservations.checks.missed_modal.dismiss') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
