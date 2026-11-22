<script setup lang="ts">
import {useId} from 'vue'

const accepted = defineModel<boolean>({required: true})
const id = useId()
</script>

<template>
  <div class="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 dark:bg-white/5 dark:border-white/10">
    <input
        :id="id"
        v-model="accepted"
        type="checkbox"
        class="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-haven-blue cursor-pointer"
    />
    <label :for="id" class="text-xs font-bold text-haven-blue dark:text-slate-100 cursor-pointer select-none">
      {{ $t('room_rules.accept') }}
    </label>
  </div>
</template>
