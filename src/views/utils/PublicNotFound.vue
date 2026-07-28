<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="min-h-screen w-screen flex flex-col items-center justify-center text-center px-6 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
    <div class="relative mb-8 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-200 dark:bg-white/5 rounded-full blur-2xl h-28 w-28 -z-10 opacity-60"></div>
      <div class="h-24 w-24 rounded-3xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-4xl shadow-sm select-none">
        🔍
      </div>
    </div>

    <div class="space-y-3 max-w-md">
      <span class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {{ $t('errors.public_404.status_code') }}
      </span>
      <h1 class="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
        {{ $t('errors.public_404.title') }}
      </h1>
      <p class="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
        {{ $t('errors.public_404.subtitle') }}
      </p>
    </div>

    <div class="mt-8">
      <button
          @click="router.push('/')"
          class="px-5 py-2.5 bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-700 dark:hover:bg-slate-100 transition-all cursor-pointer active:scale-95"
      >
        {{ $t('errors.public_404.action') }}
      </button>
    </div>
  </div>
</template>