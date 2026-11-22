<script setup lang="ts">
import {useRoute} from 'vue-router'
import {useProfileStore} from '@/stores/profile'

const profileStore = useProfileStore()
const route = useRoute()
</script>

<template>
  <router-link
      v-if="profileStore.isMissingContactDetails && route.name !== 'user.profile'"
      :to="{name: 'user.profile'}"
      class="block mb-4 max-w-4xl mx-auto px-4 py-3 rounded-xl border border-haven-yellow bg-haven-yellow/20 text-xs md:text-sm font-bold text-haven-blue dark:text-haven-white"
  >
    {{ $t('profile.contact.banner') }}
  </router-link>
</template>
