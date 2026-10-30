<script setup lang="ts">
import {applyTheme, isDark} from '@/utils/preferences.ts'
import {useProfileStore} from '@/stores/profile.ts'

const profileStore = useProfileStore()

const toggleTheme = () => {
  const theme = isDark.value ? 'light' : 'dark'
  if (profileStore.profile) {
    profileStore.updateSettings({theme}).catch((error) => console.error('Could not save theme:', error))
  } else {
    applyTheme(theme)
  }
}
</script>

<template>
  <div class="flex items-center gap-3 p-2">
    <button
        type="button"
        role="switch"
        :aria-checked="isDark"
        :aria-label="$t('general.theme_label')"
        @click="toggleTheme"
        class="relative h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-haven-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-haven-yellow"
        :class="isDark ? 'bg-haven-green' : 'bg-haven-white'"
    >
      <span
          class="absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-200"
          :class="isDark ? 'translate-x-8 bg-haven-white' : 'translate-x-0 bg-haven-yellow'"
      >
        <svg
            v-if="!isDark"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3"
            stroke="currentColor"
            class="h-4 w-4 text-haven-red"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.59 1.59m12.38 12.38l1.59 1.59M3 12h2.25m13.5 0H21M4.22 19.78l1.59-1.59M18.2 5.8l1.59-1.59M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
        </svg>
        <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            class="h-3.5 w-3.5 text-haven-blue"
        >
          <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      </span>
    </button>

    <span
        v-if="isDark"
        :title="$t('general.darkmode_beta')"
        class="text-[10px] font-black uppercase tracking-widest text-white/40"
    >
      Beta
    </span>
  </div>
</template>
