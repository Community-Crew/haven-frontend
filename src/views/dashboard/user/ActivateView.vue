<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { userService } from '@/services/userService'
import AppLayout from '@/layouts/AppLayout.vue'
import {useI18n} from "vue-i18n";

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const {t} = useI18n();

const code = ref('')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

function formatCode(value: string): string {
  let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

  if (cleaned.length > 8) {
    cleaned = cleaned.slice(0, 8)
  }

  return cleaned.length > 4 ? `${cleaned.slice(0, 4)}-${cleaned.slice(4)}` : cleaned
}

function formatInput(event: Event) {
  const target = event.target as HTMLInputElement
  code.value = formatCode(target.value)
  target.value = code.value
}

// A registration label's QR code links here with the code pre-filled
// (e.g. /dashboard/activate?code=XXXX-XXXX) so scanning it is enough to land
// on a ready-to-submit form - the resident just double-checks and confirms.
const queryCode = route.query.code
if (typeof queryCode === 'string') {
  code.value = formatCode(queryCode)
}

async function handleActivation() {
  const sanitizedCode = code.value.trim()

  if (!sanitizedCode || sanitizedCode.length !== 9) {
    errorMessage.value = t('activation.invalid_input')
    return
  }

  isLoading.value = true
  errorMessage.value = null

  try {
    await userService.activateAccount(sanitizedCode)
    await profileStore.fetchProfile()
    router.push({ name: 'home.index' })
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || t('activation.invalid_code')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <AppLayout>
    <div class="w-full flex items-center justify-center py-6 px-2 sm:px-4">
      <div class="max-w-md w-full bg-white border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b]">

        <div class="border-b-2 border-slate-100 pb-4 mb-4 text-center">
          <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-haven-blue/5 text-haven-blue mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
              <path d="M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8a.5.5 0 0 1 0 1H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V8a.5.5 0 0 1 1 0v5a1.5 1.5 0 0 1-1.5 1.5z"/>
              <path d="m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0"/>
            </svg>
          </div>
          <h2 class="text-base font-black text-haven-blue uppercase tracking-wider">
            {{ $t('activation.title') }}
          </h2>
          <p class="mt-1 text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {{ $t('activation.subtitle') }}
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleActivation">
          <div class="space-y-1">
            <label for="activation-code" class="block text-xs font-black uppercase text-haven-blue/70">
              {{ $t('activation.input_label') }}
            </label>
            <div class="relative">
              <input
                  id="activation-code"
                  type="text"
                  required
                  v-model="code"
                  @input="formatInput"
                  placeholder="XXXX-XXXX"
                  class="block w-full border-2 border-haven-blue rounded-xl px-4 py-3 text-center font-mono text-xl font-black tracking-widest text-slate-700 placeholder-slate-300 transition-colors focus:outline-none focus:bg-slate-50 uppercase disabled:bg-slate-50 disabled:text-slate-400"
                  :disabled="isLoading"
                  maxlength="9"
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck="false"
              />
            </div>
          </div>

          <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
          >
            <div v-if="errorMessage" class="p-3 rounded-xl border-2 bg-red-50 border-red-200 text-red-700 text-xs font-bold text-center flex items-center justify-center gap-2">
              <svg class="h-4 w-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </Transition>

          <div class="pt-2">
            <button
                type="submit"
                :disabled="isLoading"
                class="w-full flex items-center justify-center py-3 bg-haven-blue text-white text-xs font-black uppercase tracking-widest rounded-xl border-2 border-haven-blue shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>

              <span>{{ isLoading ? $t('activation.btn_loading') : $t('activation.btn_default') }}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  </AppLayout>
</template>