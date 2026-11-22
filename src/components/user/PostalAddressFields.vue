<script setup lang="ts">
import type {PostalAddress} from '@/services/userService'

const address = defineModel<PostalAddress>({required: true})

const inputClass = 'w-full px-3 py-2 rounded-lg border border-haven-blue/20 dark:border-white/20 bg-white dark:bg-slate-900 text-base md:text-sm text-haven-blue dark:text-haven-white'
const labelClass = 'block font-semibold text-haven-blue/70 dark:text-white/70'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="space-y-1 sm:col-span-3">
      <label for="address-line" :class="labelClass">{{ $t('profile.contact.address_line') }}</label>
      <input id="address-line" v-model="address.line" type="text" autocomplete="street-address" required maxlength="255" :class="inputClass"/>
    </div>
    <div class="space-y-1">
      <label for="address-postal-code" :class="labelClass">{{ $t('profile.contact.postal_code') }}</label>
      <input id="address-postal-code" v-model="address.postal_code" type="text" autocomplete="postal-code" required maxlength="16" :class="inputClass"/>
    </div>
    <div class="space-y-1">
      <label for="address-city" :class="labelClass">{{ $t('profile.contact.city') }}</label>
      <input id="address-city" v-model="address.city" type="text" autocomplete="address-level2" required maxlength="120" :class="inputClass"/>
    </div>
    <div class="space-y-1">
      <label for="address-country" :class="labelClass">{{ $t('profile.contact.country') }}</label>
      <input id="address-country" v-model="address.country" type="text" autocomplete="country" required minlength="2" maxlength="2" pattern="[A-Za-z]{2}" class="uppercase" :class="inputClass"/>
    </div>
  </div>
</template>
