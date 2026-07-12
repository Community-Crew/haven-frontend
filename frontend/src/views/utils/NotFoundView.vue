<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/layouts/AppLayout.vue";
import DashboardNotFound from "@/views/utils/DashboardNotFound.vue";
import PublicNotFound from "@/views/utils/PublicNotFound.vue";

const route = useRoute();

const isDashboardPath = computed(() => {
  return route.path.startsWith("/dashboard");
});
</script>

<template>
  <AppLayout v-if="isDashboardPath">
    <DashboardNotFound />
  </AppLayout>

  <div v-else>
    <PublicNotFound />
  </div>
</template>