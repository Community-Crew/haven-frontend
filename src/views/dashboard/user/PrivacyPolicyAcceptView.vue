<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useProfileStore} from '@/stores/profile'
import {privacyPolicyService} from '@/services/privacyPolicyService.ts'
import type {PrivacyPolicy} from '@/types/privacyPolicy.ts'
import AppLayout from '@/layouts/AppLayout.vue'
import PrivacyPolicyContent from '@/components/utils/PrivacyPolicyContent.vue'

const {t, locale} = useI18n()
const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()

const policy = ref<PrivacyPolicy | null>(null)
const isLoading = ref(true)
const isAccepting = ref(false)
const fetchError = ref(false)
const acceptError = ref<string | null>(null)

onMounted(async () => {
  try {
    policy.value = await privacyPolicyService.getPrivacyPolicy()
  } catch (err) {
    console.error('Failed loading the privacy policy:', err)
    fetchError.value = true
  } finally {
    isLoading.value = false
  }
})

async function handleAccept() {
  isAccepting.value = true
  acceptError.value = null

  try {
    await privacyPolicyService.acceptPrivacyPolicy()
    await profileStore.fetchProfile()

    // Preserves the originally requested destination (e.g. an
    // /activate?code=... QR-code deep link the guard interrupted) - only
    // trust it if it actually points back into the app.
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/dashboard/')) {
      router.push(redirect)
    } else {
      router.push({name: 'home.index'})
    }
  } catch (err) {
    console.error('Failed to accept the privacy policy:', err)
    acceptError.value = t('privacy_policy_accept.error')
  } finally {
    isAccepting.value = false
  }
}

const displayedContent = computed(() => {
  if (!policy.value) return ''
  return locale.value === 'en' && policy.value.content_en ? policy.value.content_en : policy.value.content
})
</script>

<template>
  <AppLayout>
    <div class="max-w-3xl mx-auto p-4 sm:p-6 md:p-8">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-black text-haven-blue uppercase tracking-tight">
          {{ t('privacy_policy_accept.title') }}
        </h1>
        <p class="mt-1 text-xs text-slate-500 font-medium">
          {{ t('privacy_policy_accept.subtitle') }}
        </p>
      </div>

      <div v-if="isLoading" class="text-center py-24 text-xs font-bold uppercase text-slate-400 tracking-widest animate-pulse">
        {{ $t('general.loading') }}
      </div>

      <div v-else-if="fetchError" class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <p class="text-xs font-bold text-red-700 uppercase tracking-wider">{{ t('privacy_policy.error') }}</p>
      </div>

      <template v-else>
        <div class="bg-white border-2 border-haven-blue rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_#091d4b] max-h-[50vh] overflow-y-auto mb-4">
          <PrivacyPolicyContent :html="displayedContent" />
        </div>

        <p v-if="acceptError" class="text-xs font-bold text-red-700 text-center mb-3">{{ acceptError }}</p>

        <button
            @click="handleAccept"
            :disabled="isAccepting"
            class="w-full px-4 py-3 bg-haven-blue text-white rounded-xl text-sm font-black uppercase tracking-wide shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ isAccepting ? t('privacy_policy_accept.action_loading') : t('privacy_policy_accept.action') }}
        </button>
      </template>
    </div>
  </AppLayout>
</template>
