<script setup lang="ts">
// Shared rich-content rendering for the privacy policy text, used by both
// the public informational page and the dashboard accept-gate.
defineProps<{
  html: string
}>()
</script>

<template>
  <div
      class="text-sm text-haven-black dark:text-white/90
             [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-haven-blue [&_h2]:dark:text-white [&_h2]:uppercase [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:first:mt-0
             [&_h3]:text-base [&_h3]:font-black [&_h3]:text-haven-blue [&_h3]:dark:text-white [&_h3]:mt-6 [&_h3]:mb-2
             [&_p]:mb-3 [&_p]:leading-relaxed [&_p:last-child]:mb-0
             [&_a]:text-haven-blue [&_a]:dark:text-haven-yellow [&_a]:underline
             [&_strong]:font-bold
             [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1"
      v-html="html"
  />
</template>
