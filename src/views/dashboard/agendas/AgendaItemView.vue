<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {agendaService} from "@/services/agendaService.js";
import type {AgendaItem} from "@/types/agendaItem.js";
import AppLayout from "@/layouts/AppLayout.vue";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const route = useRoute()
const router = useRouter()

const agendaItem = ref<AgendaItem | null>(null)
const isLoading = ref(true)
const fetchError = ref<string | null>(null)

const formatEventTime = (startStr: string, endStr: string) => {
  const format = (dateStr: string) => {
    const d = new Date(dateStr.replace(/-/g, "/"));
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false});
  }
  return `${format(startStr)} - ${format(endStr)}`;
}

const formatEventDate = (dateStr: string) => {
  const d = new Date(dateStr.replace(/-/g, "/"));
  return d.toLocaleDateString([], {day: '2-digit', month: 'short', year: 'numeric'});
}

const placeholderPalette = [
  {bg: 'bg-haven-pink', text: 'text-haven-blue'},
  {bg: 'bg-haven-yellow', text: 'text-haven-blue'},
  {bg: 'bg-haven-light-blue', text: 'text-haven-blue'},
  {bg: 'bg-haven-red', text: 'text-white'},
  {bg: 'bg-haven-green', text: 'text-white'},
  {bg: 'bg-haven-blue', text: 'text-white'},
]

const getPlaceholderStyle = (id: number) => placeholderPalette[id % placeholderPalette.length]!

onMounted(async () => {
  try {
    isLoading.value = true
    fetchError.value = null

    const agendaSlug = route.params.agendaSlug as string
    const itemId = route.params.itemId as string

    const agendaRes = await agendaService.getAgenda(agendaSlug)
    const foundItem = (agendaRes.data.items || []).find((item: AgendaItem) => String(item.id) === itemId)

    if (!foundItem) {
      throw new Error('Item not found')
    }

    agendaItem.value = foundItem
  } catch (err: any) {
    console.error("Failed loading target agenda item:", err)
    fetchError.value = t('agendas.item_not_found')
  } finally {
    isLoading.value = false
  }
})

const handleBackClick = () => {
  router.push({name: 'agenda.index', query: {agenda: route.params.agendaSlug as string}})
}
</script>

<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <button
          @click="handleBackClick"
          class="text-xs font-black uppercase text-haven-blue/70 hover:text-haven-blue transition-colors flex items-center gap-1 cursor-pointer"
      >
        {{ $t('general.back') }}
      </button>

      <div v-if="isLoading"
           class="text-center py-24 text-xs font-bold uppercase text-slate-400 tracking-widest animate-pulse">
        {{ $t('general.loading') }}
      </div>

      <div v-else-if="fetchError"
           class="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center max-w-md mx-auto">
        <p class="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">{{ fetchError }}</p>
        <button
            @click="handleBackClick"
            class="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-black text-slate-700"
        >
          {{ $t('general.return') }}
        </button>
      </div>

      <div v-else-if="agendaItem"
           class="bg-white space-y-4 border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b]">

        <img
            v-if="agendaItem.image_url"
            :src="agendaItem.image_url"
            alt="Event cover banner"
            class="w-full aspect-video object-cover rounded-xl border border-haven-blue/20"
        />
        <div
            v-else
            :class="[getPlaceholderStyle(agendaItem.id).bg, 'w-full aspect-video rounded-xl border border-haven-blue/20 flex items-center justify-center p-6']"
        >
          <span :class="[getPlaceholderStyle(agendaItem.id).text, 'font-black uppercase text-center leading-tight tracking-wide text-xl line-clamp-3']">
            {{ agendaItem.title }}
          </span>
        </div>

        <div class="flex items-start justify-between space-x-4">
          <h1 class="text-2xl font-black text-haven-blue uppercase tracking-tight">
            {{ agendaItem.title }}
          </h1>
          <div class="text-right shrink-0">
            <p class="text-xs font-black text-haven-blue">{{ formatEventDate(agendaItem.start_date) }}</p>
            <p class="text-xs font-bold text-haven-blue/60">
              {{ formatEventTime(agendaItem.start_date, agendaItem.end_date) }}
            </p>
          </div>
        </div>

        <div v-if="agendaItem.host" class="border-t border-b border-slate-100 py-3">
          <div class="flex justify-between items-center text-xs font-medium text-slate-500">
            <span>{{ $t('agendas.host') }}</span>
            <span class="font-black text-slate-800">{{ agendaItem.host }}</span>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-black uppercase text-slate-400 tracking-wide mb-1">{{ $t('agendas.description') }}</h4>
          <div
              class="text-xs text-slate-600 leading-relaxed font-medium [&_p]:mb-2 [&_p:last-child]:mb-0 [&_a]:underline [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
              v-html="agendaItem.description"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>
