<script setup lang="ts">
import type {Room} from "@/types/room.ts";
import {useI18n} from "vue-i18n";

const {t} = useI18n()

defineProps<{
  room: Room
}>()

defineEmits(['book'])

const statusLabels: Record<string, string> = {
  available: t('room_status.available'),
  occupied: t('room_status.occupied'),
  reserved: t('room_status.reserved'),
  maintenance: t('room_status.maintenance'),
  cleaning: t('room_status.cleaning')
}
</script>

<template>
  <div
      class="bg-white rounded-2xl border-2 border-haven-blue overflow-hidden shadow-[4px_4px_0px_0px_#091d4b] flex flex-col justify-between h-full group hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#091d4b] transition-all duration-200">

    <div class="relative h-48 w-full bg-haven-white/40 overflow-hidden shrink-0">
      <img
          :src="room.image_url"
          :alt="room.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      <span
          class="absolute top-3 left-3 text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 transition-colors"
          :class="{
          'bg-haven-green': room.status === 'available',
          'bg-haven-blue': room.status === 'occupied',
          'bg-haven-light-blue': room.status === 'reserved',
          'bg-haven-red': room.status === 'maintenance',
          'bg-haven-yellow text-haven-blue': room.status === 'cleaning',
        }"
      >
        <span
            class="w-1.5 h-1.5 rounded-full"
            :class="room.status === 'available' ? 'bg-haven-white/40 animate-pulse' : 'bg-current'"
        ></span>

        {{ statusLabels[room.status] || room.status }}
      </span>
    </div>

    <div class="p-5 flex-1 flex flex-col justify-between bg-haven-white/40">
      <div>
        <div class="flex flex-wrap gap-1.5 mb-2">
          <span
              class="text-[10px] bg-haven-light-blue/20 text-haven-blue font-black px-2 py-0.5 rounded uppercase tracking-wider">
            📍 {{ room.location }}
          </span>
        </div>

        <h3 class="text-xl font-black text-haven-blue leading-tight mb-1 truncate">
          {{ room.name }}
        </h3>
        <p class="text-xs text-haven-blue/70 line-clamp-2 font-medium leading-relaxed">
          {{ room.description }}
        </p>
      </div>

      <button
          @click="$emit('book')"
          class="mt-5 w-full font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer bg-haven-red text-white hover:bg-haven-red/90 shadow-haven-red/10'"
      >
        {{ $t('rooms.view') }}
      </button>
    </div>

  </div>
</template>