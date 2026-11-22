<script setup lang="ts">
import {useRoomRuleSections} from '@/composables/useRoomRuleSections'
import type {RoomRules} from '@/types/room'

const props = defineProps<{
  rules: RoomRules
}>()

const sections = useRoomRuleSections(() => props.rules)
</script>

<template>
  <div class="space-y-4">
    <section v-for="section in sections" :key="section.key" class="space-y-2">
      <h4 class="text-xs font-black uppercase tracking-wider text-haven-blue dark:text-slate-100">
        {{ section.title }}
      </h4>

      <p
          v-for="rule in section.items"
          :key="rule.key"
          class="rounded-xl border-2 border-slate-200 bg-white p-3 text-sm font-medium leading-snug whitespace-pre-line wrap-anywhere text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      >
        {{ rule.text }}
      </p>
    </section>
  </div>
</template>
