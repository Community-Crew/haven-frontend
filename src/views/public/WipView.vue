<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const enterPortal = () => {
  router.push({ name: 'home.index' });
};
</script>

<template>
  <div class="min-h-[65vh] flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto py-12">

    <div class="relative mb-8 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-200 dark:bg-white/5 rounded-full blur-2xl h-24 w-24 -z-10 opacity-60"></div>
      <div class="h-20 w-20 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-3xl shadow-sm select-none">
        ✨
      </div>
    </div>

    <div class="space-y-3">
      <span class="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
        {{ $t('public_wip.badge') }}
      </span>

      <h1 class="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight pt-2">
        {{ $t('public_wip.title') }}
      </h1>

      <p class="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto pt-1">
        {{ $t('public_wip.subtitle') }}
      </p>
    </div>

    <div class="w-12 h-0.5 bg-slate-200 dark:bg-white/10 my-8 rounded-full"></div>

    <div class="bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-sm">
      <h2 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
        {{ $t('public_wip.portal.title') }}
      </h2>
      <p class="text-xs text-slate-400 dark:text-slate-500 mb-5 font-semibold">
        {{ $t('public_wip.portal.subtitle') }}
      </p>

      <button
          @click="enterPortal"
          class="w-full px-4 py-2.5 bg-slate-800 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
      >
        {{ $t('public_wip.portal.action') }}
      </button>
    </div>

  </div>
</template>