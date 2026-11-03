<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

/**
 * When the logged-in resident may book this room, from the weekly schedule
 * the room page already fetches (/rooms/{id}/weekly-schedule) - already
 * narrowed down to what their own role(s) allow, so this is "your" policy.
 */
const props = defineProps<{
  schedule: { date: string; entries: { start: string; end: string; max_days: number }[] }[] | null
}>()

const {t, locale} = useI18n()

const time = (value: string) => value.substring(0, 5)

const days = computed(() => (props.schedule ?? []).map(day => ({
  // Noon UTC, so no timezone can tip the date over into the next/previous day.
  name: new Intl.DateTimeFormat(locale.value, {weekday: 'long', timeZone: 'UTC'}).format(new Date(`${day.date}T12:00:00Z`)),
  windows: day.entries.map(entry => time(entry.start) === '00:00' && ['00:00', '24:00'].includes(time(entry.end))
      ? t('room_policy.all_day')
      : `${time(entry.start)} – ${time(entry.end)}`),
})))

const maxDays = computed(() => Math.max(0, ...(props.schedule ?? []).flatMap(day => day.entries.map(entry => entry.max_days))))
const bookable = computed(() => days.value.some(day => day.windows.length > 0))
</script>

<template>
  <section class="bg-white border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b] dark:bg-slate-800 dark:border-white/10 dark:shadow-none max-w-xl mx-auto">
    <h3 class="text-base font-black text-haven-blue dark:text-slate-100 uppercase tracking-wider">{{ $t('room_policy.title') }}</h3>

    <p v-if="!bookable" class="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
      {{ $t('room_policy.not_bookable') }}
    </p>

    <template v-else>
      <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {{ $t('room_policy.advance', {days: maxDays}, maxDays) }}
      </p>

      <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-xs">
        <template v-for="day in days" :key="day.name">
          <dt class="font-black uppercase tracking-wider text-slate-400 capitalize">{{ day.name }}</dt>
          <dd class="font-bold text-slate-700 dark:text-slate-200">
            <span v-if="day.windows.length">{{ day.windows.join(', ') }}</span>
            <span v-else class="italic font-medium text-slate-400 dark:text-slate-500">{{ $t('room_policy.closed') }}</span>
          </dd>
        </template>
      </dl>
    </template>
  </section>
</template>
