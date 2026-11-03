<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { applyLocale } from '@/utils/preferences.ts'
import { useProfileStore } from '@/stores/profile.ts'
import type { Locale } from '@/types/userSettings.ts'

const { locale } = useI18n()
const profileStore = useProfileStore()

const changeLanguage = (lang: Locale) => {
  if (profileStore.profile) {
    profileStore.updateSettings({ locale: lang }).catch((error) => console.error('Could not save language:', error))
  } else {
    applyLocale(lang)
  }
}
</script>

<template>
  <div class="flex items-center space-x-2 text-xs font-bold text-white/70 px-4 mt-2">
    <button
        @click="changeLanguage('nl')"
        class="cursor-pointer hover:text-white transition-colors"
        :class="{ 'text-haven-yellow font-black underline': locale === 'nl' }"
    >
      NL
    </button>
    <span>|</span>
    <button
        @click="changeLanguage('en')"
        class="cursor-pointer hover:text-white transition-colors"
        :class="{ 'text-haven-yellow font-black underline': locale === 'en' }"
    >
      EN
    </button>
  </div>
</template>