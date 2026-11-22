<script setup lang="ts">
import RoomRulesList from '@/components/rooms/RoomRulesList.vue'
import type {RoomRules} from '@/types/room'

/** Always visible next to the scheduler on desktop. */
defineProps<{
  rules: RoomRules
}>()
</script>

<template>
  <section class="bg-white border-2 border-haven-blue rounded-2xl p-6 space-y-4 shadow-[4px_4px_0px_0px_#091d4b] dark:bg-slate-800 dark:border-white/10 dark:shadow-none">
    <h3 class="text-base font-black text-haven-blue dark:text-slate-100 uppercase tracking-wider">
      {{ $t('room_rules.popup_title') }}
    </h3>
    <RoomRulesList :rules="rules"/>
  </section>
</template>
