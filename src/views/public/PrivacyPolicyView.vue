<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {privacyPolicyService} from '@/services/privacyPolicyService.ts'
import type {PrivacyPolicy} from '@/types/privacyPolicy.ts'
import LocaleSwitcher from '@/components/utils/LocaleSwitcher.vue'
import PrivacyPolicyContent from '@/components/utils/PrivacyPolicyContent.vue'

const {t, locale} = useI18n()
const router = useRouter()

const policy = ref<PrivacyPolicy | null>(null)
const isLoading = ref(true)
const fetchError = ref(false)

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

// English is a courtesy translation only - the Dutch text is always what's
// actually shown unless the visitor is in English mode AND a translation
// has been entered (see PrivacyPolicyResource on the backend).
const isShowingTranslation = computed(() => locale.value === 'en' && !!policy.value?.content_en)

const displayedContent = computed(() => {
  if (!policy.value) return ''
  return isShowingTranslation.value ? policy.value.content_en! : policy.value.content
})

const formattedUpdatedAt = computed(() => {
  if (!policy.value?.updated_at) return ''
  // updated_at is a full ISO-8601 timestamp (with time + Z), which every
  // engine parses correctly natively - unlike the date-only "YYYY-MM-DD"
  // strings elsewhere in the app, this doesn't need the dash->slash
  // Safari workaround (and applying it here breaks parsing entirely).
  const d = new Date(policy.value.updated_at)
  return d.toLocaleDateString(locale.value === 'nl' ? 'nl-NL' : 'en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
})
</script>

<template>
  <div class="min-h-screen bg-haven-white dark:bg-haven-blue text-haven-black">
    <header class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
      <button
          @click="router.back()"
          class="text-xs font-black uppercase text-haven-blue/70 dark:text-white/70 hover:text-haven-blue dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
      >
        {{ $t('general.back') }}
      </button>
      <LocaleSwitcher class="!px-0 !mt-0 !text-haven-blue/70 dark:!text-white/70" />
    </header>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-black text-haven-blue dark:text-white uppercase tracking-tight">
          {{ t('privacy_policy.title') }}
        </h1>
        <p v-if="formattedUpdatedAt" class="mt-2 text-xs font-bold uppercase tracking-wide text-haven-blue/50 dark:text-white/50">
          {{ t('privacy_policy.last_updated', {date: formattedUpdatedAt}) }}
        </p>
      </div>

      <div v-if="isLoading" class="text-center py-24 text-xs font-bold uppercase text-slate-400 tracking-widest animate-pulse">
        {{ $t('general.loading') }}
      </div>

      <div v-else-if="fetchError" class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <p class="text-xs font-bold text-red-700 uppercase tracking-wider">{{ t('privacy_policy.error') }}</p>
      </div>

      <template v-else-if="policy">
        <p
            v-if="isShowingTranslation"
            class="mb-6 text-xs font-bold bg-haven-yellow/20 border border-haven-yellow text-haven-blue dark:text-white rounded-xl px-4 py-3"
        >
          {{ t('privacy_policy.translation_notice') }}
        </p>
        <p
            v-else-if="locale === 'en' && !policy.content_en"
            class="mb-6 text-xs font-bold bg-haven-yellow/20 border border-haven-yellow text-haven-blue dark:text-white rounded-xl px-4 py-3"
        >
          {{ t('privacy_policy.no_translation_notice') }}
        </p>

        <div class="bg-white dark:bg-white/5 border-2 border-haven-blue dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-[4px_4px_0px_0px_#091d4b] dark:shadow-none">
          <PrivacyPolicyContent :html="displayedContent" />
        </div>
      </template>
    </div>
  </div>
</template>
