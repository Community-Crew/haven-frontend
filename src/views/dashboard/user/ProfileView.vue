<script setup lang="ts">
import {computed, ref} from 'vue'
import {useProfileStore} from '@/stores/profile'
import {logout} from '@/services/keycloak'
import AppLayout from "@/layouts/AppLayout.vue"
import type {Locale, Theme, UserSettings} from '@/types/userSettings.ts'

const profileStore = useProfileStore()

const userProfile = computed(() => profileStore.profile)

const locales: { value: Locale, label: string }[] = [
  {value: 'nl', label: 'Nederlands'},
  {value: 'en', label: 'English'},
]
const themes: Theme[] = ['system', 'light', 'dark']

const settingsError = ref(false)

async function updateSetting(changes: Partial<UserSettings>) {
  settingsError.value = false
  try {
    await profileStore.updateSettings(changes)
  } catch (error) {
    console.error('Could not save settings:', error)
    settingsError.value = true
  }
}

const formattedActivationDate = computed(() => {
  if (!userProfile.value?.activated_at) return '—'

  const date = new Date(userProfile.value.activated_at)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

async function handleLogout() {
  try {
    await logout()
  } catch (error) {
    console.error('Logout operation failed:', error)
  }
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto space-y-8">

      <div>
        <h2 class="text-2xl font-black text-haven-blue dark:text-haven-white md:text-3xl">
          {{ $t('profile.title') }}
        </h2>
        <p class="text-xs md:text-sm text-haven-blue/70 dark:text-haven-white/70 font-medium">
          {{ $t('profile.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">

        <div
            class="bg-white/40 dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm text-center flex flex-col items-center justify-center">
          <div
              class="h-20 w-20 rounded-full bg-haven-blue/5 dark:bg-white/10 border-2 border-haven-blue/10 dark:border-white/10 flex items-center justify-center text-haven-blue dark:text-haven-white font-black text-2xl mb-4 shadow-inner">
            {{ userProfile?.name?.charAt(0) || 'U' }}
          </div>
          <h2 class="text-xl font-black text-haven-blue dark:text-haven-white">
            {{ userProfile?.name || 'Resident User' }}
          </h2>
          <p class="text-xs md:text-sm text-haven-blue/60 dark:text-white/60 font-semibold mb-6">
            {{ userProfile?.email }}
          </p>
          <p class="text-xs md:text-sm text-haven-blue/60 dark:text-white/60 font-semibold mb-6">
            Since: {{ formattedActivationDate }}
          </p>
        </div>

        <div class="md:col-span-2 space-y-6">
          <div class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5">
              <h3 class="font-black text-sm text-haven-blue dark:text-haven-white tracking-wide uppercase">
                {{ $t('profile.unit_title') }}
              </h3>
            </div>

            <div class="divide-y divide-gray-100 dark:divide-white/10 px-6 py-2 text-xs md:text-sm text-haven-blue/80 dark:text-white/80 font-medium">
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 dark:text-white/50 font-semibold">{{ $t('profile.unit.building') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue dark:text-haven-white bg-haven-blue/5 dark:bg-white/10 border border-haven-blue/10 dark:border-white/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ userProfile?.unit?.building ?? $t('general.not_applicable') }}
                </span>
              </div>
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 dark:text-white/50 font-semibold">{{ $t('profile.unit.floor') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue dark:text-haven-white bg-haven-blue/5 dark:bg-white/10 border border-haven-blue/10 dark:border-white/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ userProfile?.unit?.floor ?? $t('general.not_applicable') }}
                </span>
              </div>
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 dark:text-white/50 font-semibold">{{ $t('profile.unit.unit') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue dark:text-haven-white bg-haven-blue/5 dark:bg-white/10 border border-haven-blue/10 dark:border-white/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ userProfile?.unit?.unit ?? $t('general.not_applicable') }} {{ userProfile?.unit?.subunit ?? '' }}
                </span>
              </div>
              <br/>
            </div>
          </div>

          <div class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5">
              <h3 class="font-black text-sm text-haven-blue dark:text-haven-white tracking-wide uppercase">
                {{ $t('profile.settings_title') }}
              </h3>
            </div>

            <div class="divide-y divide-gray-100 dark:divide-white/10 px-6 py-2 text-xs md:text-sm">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 sm:items-center">
                <span class="text-haven-blue/50 dark:text-white/50 font-semibold">{{ $t('profile.settings.language') }}</span>
                <div class="sm:col-span-2 flex flex-wrap gap-2">
                  <button
                      v-for="option in locales"
                      :key="option.value"
                      type="button"
                      @click="updateSetting({locale: option.value})"
                      :aria-pressed="userProfile?.settings?.locale === option.value"
                      class="px-3 py-1.5 rounded-lg text-xs font-black border transition-colors cursor-pointer"
                      :class="userProfile?.settings?.locale === option.value
                        ? 'bg-haven-blue text-white border-haven-blue dark:bg-haven-yellow dark:text-haven-blue dark:border-haven-yellow'
                        : 'bg-haven-blue/5 text-haven-blue border-haven-blue/10 hover:bg-haven-blue/10 dark:bg-white/10 dark:text-haven-white dark:border-white/10 dark:hover:bg-white/20'"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 sm:items-center">
                <span class="text-haven-blue/50 dark:text-white/50 font-semibold">{{ $t('profile.settings.theme') }}</span>
                <div class="sm:col-span-2 flex flex-wrap gap-2">
                  <button
                      v-for="theme in themes"
                      :key="theme"
                      type="button"
                      @click="updateSetting({theme})"
                      :aria-pressed="userProfile?.settings?.theme === theme"
                      class="px-3 py-1.5 rounded-lg text-xs font-black border transition-colors cursor-pointer"
                      :class="userProfile?.settings?.theme === theme
                        ? 'bg-haven-blue text-white border-haven-blue dark:bg-haven-yellow dark:text-haven-blue dark:border-haven-yellow'
                        : 'bg-haven-blue/5 text-haven-blue border-haven-blue/10 hover:bg-haven-blue/10 dark:bg-white/10 dark:text-haven-white dark:border-white/10 dark:hover:bg-white/20'"
                  >
                    {{ $t(`profile.settings.theme_${theme}`) }}
                  </button>
                </div>
              </div>
            </div>

            <p v-if="settingsError" class="px-6 pb-4 text-xs font-bold text-haven-red">
              {{ $t('profile.settings.save_failed') }}
            </p>
          </div>

          <div class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-haven-red/30 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-red-100 dark:border-haven-red/30 bg-haven-red/40 dark:bg-haven-red/20">
              <h3 class="font-black text-sm text-red-900 dark:text-haven-pink tracking-wide uppercase">
                {{ $t('profile.actions_title') }}
              </h3>
            </div>
            <div class="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="space-y-0.5">
                <h4 class="text-sm font-black text-haven-blue dark:text-haven-white">{{ $t('profile.logout_title') }}</h4>
                <p class="text-xs text-haven-blue/60 dark:text-white/60 font-medium leading-relaxed max-w-md">
                  {{ $t('profile.logout_description') }}
                </p>
              </div>
              <button
                  @click="handleLogout"
                  type="button"
                  class="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-200 text-xs md:text-sm font-black text-red-700 hover:bg-red-50 active:bg-red-100 dark:border-haven-red/40 dark:text-haven-pink dark:hover:bg-haven-red/10 dark:active:bg-haven-red/20 transition-colors shrink-0"
              >
                {{ $t('general.logout') }}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
</style>