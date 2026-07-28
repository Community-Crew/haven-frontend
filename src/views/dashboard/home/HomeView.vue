<script setup lang="ts">

import AppLayout from "@/layouts/AppLayout.vue";
import PageTitle from "@/components/utils/PageTitle.vue";
</script>

<template>
  <AppLayout>
    <PageTitle :title="$t('home.title')" :sub-title="$t('home.subtitle')" />
  </AppLayout>
</template>

<style scoped>

</style>