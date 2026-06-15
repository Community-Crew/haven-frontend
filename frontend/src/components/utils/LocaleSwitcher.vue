<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const changeLanguage = (lang: 'en' | 'nl') => {
  locale.value = lang
  localStorage.setItem('user-locale', lang)
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