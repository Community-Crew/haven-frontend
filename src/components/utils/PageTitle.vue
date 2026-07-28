<script setup lang="ts">
defineProps<{
  title: string;
  subTitle: string;
}>();
</script>

<template>
  <div>
    <h2 class="text-2xl font-black text-haven-blue md:text-3xl">{{ title }}</h2>
    <p class="text-xs md:text-sm text-haven-blue/70 font-medium">
      {{ subTitle }}
    </p>
  </div>
</template>

<style scoped>

</style>