<script setup lang="ts">
import {computed} from 'vue'
import {useProfileStore} from '@/stores/profile'
import {logout} from '@/services/keycloak'
import AppLayout from "@/layouts/AppLayout.vue"

const profileStore = useProfileStore()

const userProfile = computed(() => profileStore.profile)

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
        <p class="text-xs md:text-sm text-haven-blue/70 dark:text-haven-white font-medium">
          {{ $t('profile.subtitle') }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">

        <div
            class="bg-white/40 p-6 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
          <div
              class="h-20 w-20 rounded-full bg-haven-blue/5 border-2 border-haven-blue/10 flex items-center justify-center text-haven-blue font-black text-2xl mb-4 shadow-inner">
            {{ userProfile?.name?.charAt(0) || 'U' }}
          </div>
          <h2 class="text-xl font-black text-haven-blue">
            {{ userProfile?.name || 'Resident User' }}
          </h2>
          <p class="text-xs md:text-sm text-haven-blue/60 font-semibold mb-6">
            {{ userProfile?.email }}
          </p>
          <p class="text-xs md:text-sm text-haven-blue/60 font-semibold mb-6">
            Since: {{ formattedActivationDate }}
          </p>
        </div>

        <div class="md:col-span-2 space-y-6">
          <div class="bg-white/40 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-white/60">
              <h3 class="font-black text-sm text-haven-blue tracking-wide uppercase">
                {{ $t('profile.unit_title') }}
              </h3>
            </div>

            <div class="divide-y divide-gray-100 px-6 py-2 text-xs md:text-sm text-haven-blue/80 font-medium">
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 font-semibold">{{ $t('profile.unit.building') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue bg-haven-blue/5 border border-haven-blue/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ userProfile?.unit?.building ?? $t('general.not_applicable') }}
                </span>
              </div>
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 font-semibold">{{ $t('profile.unit.floor') ?? $t('general.not_applicable') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue bg-haven-blue/5 border border-haven-blue/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ (userProfile?.unit?.floor) ?? 'N/A' }}
                </span>
              </div>
              <div class="grid grid-cols-3 py-2 items-center">
                <span class="text-haven-blue/50 font-semibold">{{ $t('profile.unit.unit') }}</span>
                <span
                    class="col-span-2 font-black text-haven-blue bg-haven-blue/5 border border-haven-blue/10 px-2 py-0.5 rounded-lg w-max font-mono text-xs">
                  {{ userProfile?.unit?.unit ?? $t('general.not_applicable') }} {{ userProfile?.unit?.subunit ?? '' }}
                </span>
              </div>
              <br/>
            </div>
          </div>

          <div class="bg-white/40 dark:bg-haven-white/40 rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-red-100 bg-haven-red/40">
              <h3 class="font-black text-sm text-red-900 tracking-wide uppercase">
                {{ $t('profile.actions_title') }}
              </h3>
            </div>
            <div class="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="space-y-0.5">
                <h4 class="text-sm font-black text-haven-blue">{{ $t('profile.logout_title') }}</h4>
                <p class="text-xs text-haven-blue/60 font-medium leading-relaxed max-w-md">
                  {{ $t('profile.logout_description') }}
                </p>
              </div>
              <button
                  @click="handleLogout"
                  type="button"
                  class="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-200 text-xs md:text-sm font-black text-red-700 hover:bg-red-50 active:bg-red-100 transition-colors shrink-0"
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