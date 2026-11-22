<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useProfileStore} from '@/stores/profile'
import {userService, type MembershipDocuments, type PostalAddress} from '@/services/userService'
import PrivacyPolicyContent from '@/components/utils/PrivacyPolicyContent.vue'
import PostalAddressFields from '@/components/user/PostalAddressFields.vue'

const profileStore = useProfileStore()
const profile = computed(() => profileStore.profile)
const membership = computed(() => profile.value?.membership ?? null)
const today = new Date().toISOString().slice(0, 10)

// A pending membership the board created still needs the resident's details
// and acceptance, so it gets the same form.
const needsApplication = computed(() =>
    !membership.value || (membership.value.status === 'pending' && !membership.value.documents_accepted))

const documents = ref<MembershipDocuments | null>(null)
const isLoaded = ref(false)
// Everyone saves their number in the contact card; applying reuses it.
const phone = computed(() => profile.value?.phone ?? '')
const birthDate = ref(profile.value?.birth_date ?? '')
const address = ref<PostalAddress>({...(profile.value?.postal_address ?? {line: '', postal_code: '', city: '', country: 'NL'})})
const accepted = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const isOpen = computed(() => !!documents.value?.statutes && !!documents.value?.rules)
const isFormerResident = computed(() => !!profile.value?.is_former_resident)

const removalDate = computed(() => profile.value?.anonymizes_at
    ? new Date(profile.value.anonymizes_at).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})
    : null)

const statusKey = computed(() => {
  if (!membership.value || needsApplication.value) return null
  if (membership.value.is_honorary) return `honorary_${membership.value.status}`
  return membership.value.is_beneficiary ? `beneficiary_${membership.value.status}` : membership.value.status
})

async function loadDocuments() {
  try {
    documents.value = await userService.getMembershipDocuments()
  } catch (e) {
    console.error('Could not load membership documents:', e)
    error.value = 'profile.membership.load_failed'
  } finally {
    isLoaded.value = true
  }
}

onMounted(() => {
  if (needsApplication.value) loadDocuments()
})

async function apply() {
  const statutes = documents.value?.statutes
  const rules = documents.value?.rules
  if (!statutes || !rules) return

  isSaving.value = true
  error.value = null

  try {
    await profileStore.applyForMembership({
      phone: phone.value,
      birth_date: birthDate.value,
      ...(isFormerResident.value ? {postal_address: address.value} : {}),
      statutes_document_id: statutes.id,
      rules_document_id: rules.id,
      documents_accepted: accepted.value,
    })
  } catch (e: any) {
    const errors = e.response?.data?.errors
    if (errors === 'DOCUMENTS_OUTDATED') {
      // The text changed while they were reading: show the new version.
      accepted.value = false
      await loadDocuments()
      error.value = 'profile.membership.documents_outdated'
    } else if (errors?.phone) error.value = 'profile.contact.invalid_phone'
    else if (errors?.birth_date) error.value = 'profile.membership.invalid_birth_date'
    else if (errors && typeof errors === 'object' && Object.keys(errors).some(key => key.startsWith('postal_address'))) error.value = 'profile.contact.invalid_address'
    else if (errors === 'APPLICATIONS_CLOSED') error.value = 'profile.membership.closed'
    else if (errors === 'MEMBERSHIP_ALREADY_OPEN') error.value = 'profile.membership.already_open'
    else error.value = 'profile.membership.apply_failed'
  } finally {
    isSaving.value = false
  }
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-haven-blue/20 dark:border-white/20 bg-white dark:bg-slate-900 text-base md:text-sm text-haven-blue dark:text-haven-white'
const labelClass = 'block font-semibold text-haven-blue/70 dark:text-white/70'
const detailsClass = 'rounded-lg border border-haven-blue/20 dark:border-white/20 bg-white/60 dark:bg-slate-900/60'
const summaryClass = 'px-3 py-3 font-bold text-haven-blue dark:text-haven-white cursor-pointer'
</script>

<template>
  <div class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5">
      <h3 class="font-black text-sm text-haven-blue dark:text-haven-white tracking-wide uppercase">
        {{ $t('profile.membership.title') }}
      </h3>
    </div>

    <p v-if="statusKey" class="px-6 py-4 text-xs md:text-sm font-medium text-haven-blue/80 dark:text-white/80">
      {{ $t(`profile.membership.status.${statusKey}`) }}
    </p>

    <form v-else-if="isOpen" class="px-6 py-4 space-y-4 text-xs md:text-sm" @submit.prevent="apply">
      <p class="font-medium text-haven-blue/80 dark:text-white/80">
        {{ $t(isFormerResident ? 'profile.membership.beneficiary_intro' : 'profile.membership.intro') }}
      </p>
      <p v-if="isFormerResident && removalDate" class="font-bold text-haven-blue dark:text-haven-white">
        {{ $t('profile.membership.removal_notice', {date: removalDate}) }}
      </p>

      <div class="space-y-1">
        <label for="membership-birth-date" :class="labelClass">{{ $t('profile.contact.birth_date') }}</label>
        <input id="membership-birth-date" v-model="birthDate" type="date" autocomplete="bday" required :max="today" :class="inputClass"/>
      </div>

      <PostalAddressFields v-if="isFormerResident" v-model="address"/>

      <div class="space-y-2">
        <details :class="detailsClass">
          <summary :class="summaryClass">{{ $t('profile.membership.statutes') }}</summary>
          <div class="px-3 pb-3 max-h-80 overflow-y-auto select-text">
            <PrivacyPolicyContent :html="documents!.statutes!.content"/>
          </div>
        </details>
        <details :class="detailsClass">
          <summary :class="summaryClass">{{ $t('profile.membership.rules') }}</summary>
          <div class="px-3 pb-3 max-h-80 overflow-y-auto select-text">
            <PrivacyPolicyContent :html="documents!.rules!.content"/>
          </div>
        </details>
      </div>

      <label class="flex items-start gap-3 font-semibold text-haven-blue dark:text-haven-white cursor-pointer">
        <input v-model="accepted" type="checkbox" required class="mt-0.5 h-5 w-5 shrink-0"/>
        <span>{{ $t('profile.membership.accept') }}</span>
      </label>

      <p v-if="error" class="font-bold text-haven-red">{{ $t(error) }}</p>
      <p v-else-if="!phone" class="font-bold text-haven-blue dark:text-haven-white">{{ $t('profile.membership.phone_first') }}</p>

      <button type="submit" :disabled="isSaving || !phone"
              class="w-full sm:w-auto px-5 py-3 rounded-xl bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue font-black cursor-pointer disabled:opacity-50">
        {{ $t('profile.membership.apply') }}
      </button>
    </form>

    <p v-else-if="error" class="px-6 py-4 text-xs md:text-sm font-bold text-haven-red">{{ $t(error) }}</p>

    <p v-else-if="isLoaded" class="px-6 py-4 text-xs md:text-sm font-medium text-haven-blue/80 dark:text-white/80">
      {{ $t('profile.membership.closed') }}
    </p>
  </div>
</template>
