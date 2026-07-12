<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import LocaleSwitcher from "@/components/utils/LocaleSwitcher.vue";
import type { User } from "@/types/user.ts";
import { userService } from "@/services/userService.ts";
import ThemeSwitcher from "@/components/utils/ThemeSwitcher.vue";
import { navigationItems } from "@/config/navigation.ts";
import packageInfo from '../../package.json' // 🏷️ Import your package JSON to grab the version

const isCollapsed = ref(false)
const isMoreMenuOpen = ref(false)
const user = ref<User | null>(null)
const appVersion = ref(`v${packageInfo.version}`) // 🏷️ Format version tag

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

const closeMoreMenu = () => {
  isMoreMenuOpen.value = false
}

onMounted(async () => {
  user.value = await userService.getCurrentUser();
})

const mobilePrimaryItems = computed(() =>
    navigationItems.filter(item => item.mobilePriority)
)

const mobileOverflowItems = computed(() =>
    navigationItems.filter(item => !item.mobilePriority)
)
</script>

<template>
  <div class="flex flex-col md:flex-row h-screen w-screen bg-haven-white dark:bg-haven-blue select-none overflow-hidden text-haven-black">

    <aside
        class="hidden md:flex flex-col bg-haven-blue text-white justify-between transition-all duration-300 ease-in-out relative border-r border-white/5 z-20"
        :class="isCollapsed ? 'w-20' : 'w-64'"
    >
      <button
          @click="toggleSidebar"
          class="absolute -right-3 top-7 bg-haven-red text-white h-6 w-6 rounded-full flex items-center justify-center border-2 border-haven-white text-xs cursor-pointer shadow-md z-30 transform active:scale-90 transition-transform"
      >
        {{ isCollapsed ? '→' : '←' }}
      </button>

      <div class="flex flex-col flex-1">
        <div class="flex items-center h-16 px-4 shrink-0">
          <h1 v-if="!isCollapsed" class="text-xl font-black text-haven-yellow tracking-tight truncate">
            Haven Community
          </h1>
          <span v-else class="text-xl font-black text-haven-yellow mx-auto">H</span>
        </div>

        <nav class="flex flex-col space-y-1 px-3 mt-6">
          <router-link
              v-for="item in navigationItems"
              :key="item.to"
              :to="{ name: item.to }"
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/10 transition-all"
              :class="[isCollapsed ? 'justify-center' : '', item.child && !isCollapsed ? 'pl-8 text-white/80 text-sm' : '']"
              active-class="bg-white/20 font-bold text-haven-yellow"
          >
            <span :class="item.child && !isCollapsed ? 'text-base' : 'text-lg'">{{ item.icon }}</span>
            <span v-if="!isCollapsed" class="truncate">{{ $t(item.labelKey) }}</span>
          </router-link>
        </nav>

        <div v-if="!isCollapsed" class="mt-8 px-6 space-y-6">
          <div>
            <p class="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2">{{ $t('general.language_label') }}</p>
            <LocaleSwitcher/>
          </div>
          <div>
            <p class="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2">{{ $t('general.theme_label') }}</p>
            <ThemeSwitcher/>
          </div>
        </div>
      </div>

      <div class="border-t border-white/10 flex flex-col shrink-0 bg-black/5">
        <router-link :to="{ name: 'user.profile' }" class="p-4 flex items-center"
                     :class="isCollapsed ? 'justify-center' : 'space-x-3'">
          <div v-if="user" class="flex items-center gap-3 p-2 w-full">
            <div class="h-8 w-8 rounded-full bg-haven-pink text-haven-blue font-bold flex items-center justify-center text-xs shrink-0 select-none">
              {{ user.name ? user.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() : '??' }}
            </div>

            <div v-if="!isCollapsed" class="flex flex-col min-w-0 truncate flex-1">
              <span class="text-xs font-bold text-white truncate">{{ user.name }}</span>
              <span class="text-[10px] text-white/60 uppercase font-bold tracking-wider truncate">{{ user.roles[0] }}</span>
            </div>
          </div>
        </router-link>

        <div v-if="!isCollapsed" class="px-6 pb-3 text-[9px] font-mono font-bold text-white/30 tracking-wider">
          {{ appVersion }}
        </div>
      </div>
    </aside>

    <div class="md:hidden absolute top-0 left-0 right-0 z-30 flex flex-col pointer-events-none">
      <header class="px-4 h-14 flex items-center justify-between pt-[env(safe-area-inset-top)] box-content bg-haven-blue dark:bg-haven-green pointer-events-auto">
        <h1 class="text-lg font-black text-haven-yellow tracking-tight">Haven</h1>

        <button
            @click="isMoreMenuOpen = !isMoreMenuOpen"
            class="h-8 w-8 rounded-full bg-haven-pink text-haven-blue font-black flex items-center justify-center text-xs cursor-pointer active:scale-95 transition-transform"
        >
          {{ user?.name ? user.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() : '??' }}
        </button>
      </header>
    </div>

    <main class="flex-1 relative overflow-hidden z-10 flex flex-col">
      <div class="md:hidden w-full leading-none -mt-0.5 pointer-events-none absolute top-14 left-0 z-30">
        <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" class="w-full h-auto text-haven-blue dark:text-haven-green fill-current max-h-32">
          <path d="M0,160L34.3,154.7C68.6,149,137,139,206,117.3C274.3,96,343,64,411,53.3C480,43,549,53,617,69.3C685.7,85,754,107,823,106.7C891.4,107,960,85,1029,101.3C1097.1,117,1166,171,1234,176C1302.9,181,1371,139,1406,117.3L1440,96L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z"></path>
        </svg>
      </div>

      <div class="hidden md:block absolute top-0 left-0 right-0 z-30 bg-haven-blue dark:bg-haven-white select-none pointer-events-none">
        <svg viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" class="absolute bottom-0 w-full h-auto fill-current translate-y-[98%] max-h-64" preserveAspectRatio="none">
          <path class="text-haven-blue dark:text-haven-green fill-current" d="M0,160L34.3,154.7C68.6,149,137,139,206,117.3C274.3,96,343,64,411,53.3C480,43,549,53,617,69.3C685.7,85,754,107,823,106.7C891.4,107,960,85,1029,101.3C1097.1,117,1166,171,1234,176C1302.9,181,1371,139,1406,117.3L1440,96L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z"></path>
        </svg>
      </div>

      <div class="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 webkit-scrolling-touch">
        <div class="mx-auto w-full pt-24 md:pt-0 md:mt-16 lg:mt-24">
          <slot/>
        </div>
      </div>
    </main>

    <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
    >
      <div v-if="isMoreMenuOpen" class="md:hidden fixed inset-0 bg-haven-blue text-white z-40 p-6 flex flex-col justify-between pt-20">

        <div class="flex flex-col flex-1 overflow-y-auto">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-haven-yellow uppercase tracking-wider">Features & Settings</h2>
            <button @click="closeMoreMenu" class="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">✕</button>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-8">
            <router-link
                v-for="item in mobileOverflowItems"
                :key="item.to"
                :to="{ name: item.to }"
                @click="closeMoreMenu"
                class="flex flex-col items-center justify-center aspect-square p-3 bg-white/5 rounded-2xl active:scale-95 transition-transform text-center"
                active-class="bg-haven-yellow/20 text-haven-yellow border border-haven-yellow/30"
            >
              <span class="text-2xl mb-1">{{ item.icon }}</span>
              <span class="text-[11px] leading-tight font-medium wrap-break-word w-full">{{ $t(item.labelKey) }}</span>
            </router-link>
          </div>

          <div class="border-t border-white/10 pt-6 space-y-6">
            <div>
              <p class="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2">{{ $t('general.language_label') }}</p>
              <LocaleSwitcher/>
            </div>
            <div>
              <p class="text-[10px] uppercase font-black tracking-widest text-white/40 mb-2">{{ $t('general.theme_label') }}</p>
              <ThemeSwitcher/>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2 mt-4 shrink-0">
          <router-link :to="{ name: 'user.profile' }" @click="closeMoreMenu" class="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between w-full">
            <div v-if="user" class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-haven-pink text-haven-blue font-bold flex items-center justify-center text-sm">
                {{ user.name ? user.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() : '??' }}
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white">{{ user.name }}</span>
                <span class="text-[10px] text-white/60 uppercase font-bold tracking-wider">{{ user.roles[0] }}</span>
              </div>
            </div>
            <span class="text-white/40 text-sm">➔</span>
          </router-link>

          <div class="text-center text-[10px] font-mono font-bold text-white/20 tracking-widest pt-1">
            {{ appVersion }}
          </div>
        </div>

      </div>
    </Transition>

    <nav class="md:hidden flex justify-around items-center border-t border-haven-blue/10 bg-white pb-[env(safe-area-inset-bottom)] h-16 box-content z-50 relative">
      <router-link
          v-for="item in mobilePrimaryItems"
          :key="item.to"
          :to="{ name: item.to }"
          @click="closeMoreMenu"
          class="flex flex-col items-center text-xs text-slate-500"
          active-class="text-haven-blue font-bold"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span>{{ $t(item.labelKey) }}</span>
      </router-link>

      <button
          @click="isMoreMenuOpen = !isMoreMenuOpen"
          class="flex flex-col items-center text-xs text-slate-500 cursor-pointer"
          :class="isMoreMenuOpen ? 'text-haven-yellow font-black' : ''"
      >
        <span class="text-xl">✨</span>
        <span>{{ isMoreMenuOpen ? 'Close' : 'More' }}</span>
      </button>
    </nav>

  </div>
</template>