<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const router = useRouter();
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const navigateHome = () => {
  router.push('/');
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 relative overflow-x-hidden flex flex-col antialiased transition-colors duration-200">

    <div class="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-0 pointer-events-none select-none opacity-40 dark:opacity-20">
      <svg viewBox="0 0 1440 220" fill="none" xmlns="http://www.w3.org/2000/svg" class="relative block w-full h-[180px] md:h-[220px]">
        <path d="M0 0H1440V120C1320 160 1080 200 720 160C360 120 120 180 0 140V0Z" fill="currentColor" class="text-slate-200/70 dark:text-white/5" />
      </svg>
    </div>

    <header class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
      <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl md:rounded-3xl shadow-sm px-4 md:px-6 py-3.5 flex items-center justify-between transition-all">

        <div @click="navigateHome" class="flex items-center gap-2 cursor-pointer group select-none">
          <span class="text-2xl transition-transform group-hover:scale-110 duration-200">🚪</span>
          <span class="font-black tracking-tight text-base md:text-lg bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {{ $t('public_layout.brand_name') }}
          </span>
        </div>

        <nav class="hidden md:flex items-center gap-1.5">
          <router-link
              :to="{ name: 'public.rooms.index' }"
              class="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all"
              active-class="bg-slate-900 !text-white dark:bg-white dark:!text-slate-900 shadow-sm"
          >
            {{ $t('public_layout.nav.explore_rooms') }}
          </router-link>

          <router-link
              :to="{ name: 'DashboardNotFound' }"
              class="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all ml-2"
          >
            {{ $t('public_layout.nav.resident_login') }}
          </router-link>
        </nav>

        <div class="md:hidden flex items-center">
          <button
              @click="toggleMobileMenu"
              class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 focus:outline-none transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
          >
            <span v-if="!isMobileMenuOpen" class="text-xl block w-6 h-6 text-center leading-6">☰</span>
            <span v-else class="text-xl block w-6 h-6 text-center leading-6">✕</span>
          </button>
        </div>
      </div>

      <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
      >
        <div v-if="isMobileMenuOpen" class="absolute top-full left-4 right-4 mt-2 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xl p-4 flex flex-col gap-2 md:hidden">
          <router-link
              :to="{ name: 'public.rooms.index' }"
              @click="isMobileMenuOpen = false"
              class="w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              active-class="bg-slate-50 dark:bg-white/5 font-bold text-slate-900 dark:text-white"
          >
            {{ $t('public_layout.nav.explore_rooms') }}
          </router-link>

          <div class="border-t border-slate-100 dark:border-white/5 my-1"></div>

          <router-link
              :to="{ name: 'DashboardNotFound' }"
              @click="isMobileMenuOpen = false"
              class="w-full text-center px-4 py-3 rounded-xl text-sm font-bold bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition-all shadow-sm active:scale-[0.98]"
          >
            {{ $t('public_layout.nav.resident_login') }}
          </router-link>
        </div>
      </transition>
    </header>

    <main class="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <router-view />
    </main>

    <footer class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200/40 dark:border-white/5 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
      <p>&copy; {{ new Date().getFullYear() }} {{ $t('public_layout.brand_name') }}. {{ $t('public_layout.footer_all_rights') }}.</p>
    </footer>

  </div>
</template>