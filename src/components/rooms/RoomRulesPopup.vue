<script setup lang="ts">
import {ref} from 'vue'
import RoomRulesList from '@/components/rooms/RoomRulesList.vue'
import type {RoomRules} from '@/types/room'

/** How phones read the rules - desktop has RoomRulesPanel. */
defineProps<{
  rules: RoomRules
}>()

const isOpen = ref(false)
</script>

<template>
  <div>
    <button
        type="button"
        class="w-full rounded-xl border-2 border-haven-blue bg-white px-3 py-3 text-xs font-black text-haven-blue cursor-pointer active:scale-[0.99] transition-all dark:bg-white/10 dark:border-haven-yellow dark:text-haven-yellow"
        @click="isOpen = true"
    >
      {{ $t('room_rules.read') }}
    </button>

    <Teleport to="body">
      <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="isOpen = false"
      >
        <div
            role="dialog"
            aria-modal="true"
            :aria-label="$t('room_rules.popup_title')"
            class="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full max-h-full flex flex-col gap-4 shadow-xl"
        >
          <h3 class="text-base font-black text-slate-800 dark:text-slate-100">{{ $t('room_rules.popup_title') }}</h3>

          <div class="flex-1 min-h-0 overflow-y-auto pr-1">
            <RoomRulesList :rules="rules"/>
          </div>

          <button
              type="button"
              class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue cursor-pointer active:scale-95"
              @click="isOpen = false"
          >
            {{ $t('room_rules.close') }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
