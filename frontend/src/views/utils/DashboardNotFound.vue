<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
    <div class="h-20 w-20 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-3xl shadow-sm mb-6 select-none">
      🎟️
    </div>

    <div class="space-y-2 max-w-sm">
      <h1 class="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
        {{ $t('errors.dashboard_404.title') }}
      </h1>
      <p class="text-xs font-medium text-slate-400 dark:text-slate-500 leading-relaxed">
        {{ $t('errors.dashboard_404.subtitle') }}
      </p>
    </div>

    <button
        @click="router.push({ name: 'home.index' })"
        class="mt-6 px-4 py-2 bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
    >
      {{ $t('errors.dashboard_404.action') }}
    </button>
  </div>
</template>