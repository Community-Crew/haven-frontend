<script setup lang="ts">
import {ref, onMounted} from 'vue'
import AppLayout from "@/layouts/AppLayout.vue"
import RoomCard from "@/components/rooms/RoomCard.vue"
import {roomService} from "@/services/roomService.js"
import type {Room} from '@/types/room';
import {useRouter} from "vue-router";
import PageTitle from "@/components/utils/PageTitle.vue";
import LoadingPlaceholder from "@/components/utils/LoadingPlaceholder.vue";

const roomsList = ref<Room[]>([])
const isLoading = ref(true)
const router = useRouter()

const fetchRoomsData = async () => {
  try {
    isLoading.value = true
    const response = await roomService.getRooms()

    roomsList.value = response.data
  } catch (error) {
    console.error("Failed syncing rooms from the Haven API architecture:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRoomsData()
})

const handleBookingPipeline = (room: any) => {
  router.push({
    name: 'rooms.show',
    params: {slug: room.slug}
  })
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <PageTitle :title="$t('rooms.title')" :sub-title="$t('rooms.subtitle')"/>
      <LoadingPlaceholder :is-loading="isLoading" />

      <div v-if="!isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <RoomCard
            v-for="room in roomsList"
            :key="room.id"
            :room="room"
            @book="handleBookingPipeline(room)"
        />
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
</style>