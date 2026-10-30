<script setup lang="ts">
defineProps<{
  isLoading: boolean
}>()
</script>

<template>
  <div v-if="isLoading" class="text-center py-20 font-black text-haven-blue/30 dark:text-haven-white/40 animate-pulse text-sm">
    {{ $t('general.loading') }}
  </div>
</template>

<style scoped>

</style>