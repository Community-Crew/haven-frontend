<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {useProfileStore} from '@/stores/profile'
import type {PostalAddress} from '@/services/userService'
import PostalAddressFields from '@/components/user/PostalAddressFields.vue'

const profileStore = useProfileStore()
const profile = computed(() => profileStore.profile)
// While the application form is open it asks for the birth date and address.
const isApplying = computed(() => {
  const membership = profile.value?.membership
  return membership?.status === 'pending' && !membership.documents_accepted
})
const isMember = computed(() => !!profile.value?.membership && !isApplying.value)
const isVerified = computed(() => !!profile.value?.membership?.identity_verified)
// Only beneficiaries need one on file; an erelid who moved out doesn't.
const needsAddress = computed(() => isMember.value && !!profile.value?.is_former_resident && !!profile.value?.membership?.is_beneficiary)
const today = new Date().toISOString().slice(0, 10)

const phone = ref('')
const birthDate = ref('')
const address = ref<PostalAddress>({line: '', postal_code: '', city: '', country: 'NL'})
const status = ref<'idle' | 'saving' | 'saved'>('idle')
const error = ref<string | null>(null)

watch(profile, (value) => {
  phone.value = value?.phone ?? ''
  birthDate.value = value?.birth_date ?? ''
  address.value = {...(value?.postal_address ?? {line: '', postal_code: '', city: '', country: 'NL'})}
}, {immediate: true})

async function save() {
  status.value = 'saving'
  error.value = null

  const details: { phone: string; birth_date?: string; postal_address?: PostalAddress } = {phone: phone.value}
  if (isMember.value && !isVerified.value && birthDate.value) {
    details.birth_date = birthDate.value
  }
  if (needsAddress.value) {
    details.postal_address = address.value
  }

  try {
    await profileStore.updateContactDetails(details)
    status.value = 'saved'
  } catch (e: any) {
    status.value = 'idle'
    const errors = e.response?.data?.errors ?? {}
    if (errors.phone) error.value = 'profile.contact.invalid_phone'
    else if (Object.keys(errors).some(key => key.startsWith('postal_address'))) error.value = 'profile.contact.invalid_address'
    else error.value = 'profile.contact.save_failed'
  }
}

const inputClass = 'w-full px-3 py-2 rounded-lg border border-haven-blue/20 dark:border-white/20 bg-white dark:bg-slate-900 text-base md:text-sm text-haven-blue dark:text-haven-white disabled:opacity-60'
</script>

<template>
  <div class="bg-white/40 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/60 dark:bg-white/5">
      <h3 class="font-black text-sm text-haven-blue dark:text-haven-white tracking-wide uppercase">
        {{ $t('profile.contact.title') }}
      </h3>
    </div>

    <form class="px-6 py-4 space-y-4 text-xs md:text-sm" @submit.prevent="save">
      <div class="space-y-1">
        <label for="contact-phone" class="block font-semibold text-haven-blue/70 dark:text-white/70">
          {{ $t('profile.contact.phone') }}
        </label>
        <input id="contact-phone" v-model="phone" type="tel" autocomplete="tel" required :class="inputClass"/>
      </div>

      <div v-if="isMember" class="space-y-1">
        <label for="contact-birth-date" class="block font-semibold text-haven-blue/70 dark:text-white/70">
          {{ $t('profile.contact.birth_date') }}
        </label>
        <input id="contact-birth-date" v-model="birthDate" type="date" autocomplete="bday" :max="today"
               :disabled="isVerified" :class="inputClass"/>
        <p class="text-haven-blue/60 dark:text-white/60">
          {{ $t(isVerified ? 'profile.contact.id_checked' : 'profile.contact.id_pending') }}
        </p>
      </div>

      <!-- The application form asks for it first; this is for changing it later. -->
      <PostalAddressFields v-if="needsAddress" v-model="address"/>

      <p v-if="error" class="font-bold text-haven-red">{{ $t(error) }}</p>
      <p v-else-if="status === 'saved'" class="font-bold text-haven-green dark:text-haven-yellow">
        {{ $t('profile.contact.saved') }}
      </p>

      <button type="submit" :disabled="status === 'saving'"
              class="w-full sm:w-auto px-5 py-3 rounded-xl bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue font-black cursor-pointer disabled:opacity-50">
        {{ $t('profile.contact.save') }}
      </button>
    </form>
  </div>
</template>
