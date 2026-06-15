<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from "@/layouts/AppLayout.vue"
import RoomCard from "@/components/rooms/RoomCard.vue"
import { roomService } from "@/services/roomService.ts"

interface Room {
  id: number
  name: string
  slug: string
  description: string
  location: string
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'cleaning'
  image_url: string
}

const roomsList = ref<Room[]>([])
const isLoading = ref(true)

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

const handleBookingPipeline = (room: Room) => {
  console.log(`User requested an active registration workflow target for space entity ID: ${room.id}`)
}
</script>

<template>
  <AppLayout>
    <div class="space-y-6">

      <div>
        <h2 class="text-2xl font-black text-haven-blue md:text-3xl">{{ $t('rooms.title') }}</h2>
        <p class="text-xs md:text-sm text-haven-blue/70 font-medium">
          {{ $t('rooms.subtitle') }}
        </p>
      </div>

      <div v-if="isLoading" class="text-center py-20 font-black text-haven-blue/30 animate-pulse text-sm">
        {{ $t('rooms.loading') }}
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        <RoomCard
            v-for="room in roomsList"
            :key="room.id"
            :name="room.name"
            :description="room.description"
            :image-url="room.image_url"
            :location="room.location"
            :status="room.status"
            @book="handleBookingPipeline(room)"
        />
      </div>

    </div>
  </AppLayout>
</template>

<style scoped>
</style>