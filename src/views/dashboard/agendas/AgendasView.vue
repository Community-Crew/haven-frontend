<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import {computed, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {agendaService} from "@/services/agendaService.js";
import type {Agenda} from "@/types/agenda.js";
import PageTitle from "@/components/utils/PageTitle.vue";

const route = useRoute()
const router = useRouter()

const agendasList = ref<Agenda[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const errorMessage = ref<string | null>(null)
const selectedAgendaSlug = ref<string | 'all'>('all')
const nextPageUrl = ref<string | null>(null)

const fetchAgendaData = async (isLoadMore = false) => {
  try {
    if (isLoadMore) {
      isLoadingMore.value = true;
    } else {
      isLoading.value = true;
      errorMessage.value = null;
    }

    const pageNumber = isLoadMore && nextPageUrl.value
        ? new URL(nextPageUrl.value).searchParams.get('page')
        : 1;

    const response = await agendaService.getAgendas(pageNumber)

    const incomingData = response.data || []
    nextPageUrl.value = response.links?.next || null

    if (isLoadMore) {
      agendasList.value.push(...incomingData)
    } else {
      agendasList.value = incomingData
    }
  } catch (error) {
    console.error("Failed syncing agendas:", error)
    errorMessage.value = "Could not sync agenda tracks."
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
}

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

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const placeholderPalette = [
  {bg: 'bg-haven-pink', text: 'text-haven-blue'},
  {bg: 'bg-haven-yellow', text: 'text-haven-blue'},
  {bg: 'bg-haven-light-blue', text: 'text-haven-blue'},
  {bg: 'bg-haven-red', text: 'text-white'},
  {bg: 'bg-haven-green', text: 'text-white'},
  {bg: 'bg-haven-blue', text: 'text-white'},
]

const getPlaceholderStyle = (id: number) => placeholderPalette[id % placeholderPalette.length]!

const agendaBadgePalette = [
  {bg: 'bg-haven-blue/10', text: 'text-haven-blue'},
  {bg: 'bg-haven-red/10', text: 'text-haven-red'},
  {bg: 'bg-haven-green/10', text: 'text-haven-green'},
  {bg: 'bg-haven-pink/20', text: 'text-haven-blue'},
  {bg: 'bg-haven-yellow/20', text: 'text-haven-blue'},
  {bg: 'bg-haven-light-blue/20', text: 'text-haven-blue'},
]

const getAgendaBadgeStyle = (agendaId: number) => agendaBadgePalette[agendaId % agendaBadgePalette.length]!

const visibleItems = computed(() => {
  const flattened = agendasList.value.flatMap((agenda) =>
      (agenda.items || []).map((item) => ({...item, agenda}))
  )

  const filtered = selectedAgendaSlug.value === 'all'
      ? flattened
      : flattened.filter((item) => item.agenda.slug === selectedAgendaSlug.value)

  return filtered.sort((a, b) => {
    return new Date(a.start_date.replace(/-/g, "/")).getTime() - new Date(b.start_date.replace(/-/g, "/")).getTime();
  })
})

const handleItemClick = (item: { agenda: Agenda, id: number }) => {
  router.push({name: 'agenda.item', params: {agendaSlug: item.agenda.slug, itemId: item.id}})
}

onMounted(() => {
  const queryAgendaSlug = route.query.agenda
  if (queryAgendaSlug) {
    selectedAgendaSlug.value = String(queryAgendaSlug)
  }

  fetchAgendaData()
})
</script>

<template>
  <AppLayout>
    <div class="space-y-6">

      <PageTitle :title="$t('agendas.title')" :sub-title="$t('agendas.subtitle')" />


      <div v-if="isLoading && agendasList.length === 0"
           class="text-center py-20 font-black text-haven-blue/30 animate-pulse text-sm">
        {{ $t('general.loading') }}
      </div>

      <div v-if="agendasList.length > 0"
           class="flex items-center space-x-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-none webkit-overflow-scrolling-touch shrink-0">
        <button
            @click="selectedAgendaSlug = 'all'"
            class="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-haven-blue transition-all whitespace-nowrap cursor-pointer transform active:scale-95"
            :class="selectedAgendaSlug === 'all' ? 'bg-haven-blue text-white shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-haven-blue shadow-[3px_3px_0px_0px_#091d4b]'"
        >
          <span>📅</span> <span>{{ $t('agendas.show_all')}}</span>
        </button>

        <button
            v-for="agenda in agendasList"
            :key="agenda.id"
            @click="selectedAgendaSlug = agenda.slug"
            class="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-haven-blue transition-all whitespace-nowrap cursor-pointer transform active:scale-95"
            :class="selectedAgendaSlug === agenda.slug ? 'bg-haven-blue text-white shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-haven-blue shadow-[3px_3px_0px_0px_#091d4b]'"
        >
          <span>📆</span> <span>{{ agenda.name }}</span>
        </button>
      </div>

      <div v-if="visibleItems.length > 0" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
            v-for="item in visibleItems"
            :key="item.id"
            @click="handleItemClick(item)"
            class="bg-white border-2 border-haven-blue rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_#091d4b] flex flex-col cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#091d4b]"
        >
          <img
              v-if="item.image_url"
              :src="item.image_url"
              alt="Event cover banner"
              class="w-full aspect-video object-cover border-b-2 border-haven-blue"
          />
          <div
              v-else
              :class="[getPlaceholderStyle(item.id).bg, 'w-full aspect-video border-b-2 border-haven-blue flex items-center justify-center p-4']"
          >
            <span :class="[getPlaceholderStyle(item.id).text, 'font-black uppercase text-center leading-tight tracking-wide line-clamp-3']">
              {{ item.title }}
            </span>
          </div>

          <div class="p-5 flex flex-col space-y-3 flex-1">
            <div class="space-y-1">
              <span :class="[getAgendaBadgeStyle(item.agenda.id).bg, getAgendaBadgeStyle(item.agenda.id).text, 'inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider']">
                {{ item.agenda.name }}
              </span>
              <h3 class="text-base font-black text-haven-blue leading-tight">{{ item.title }}</h3>
            </div>

            <div class="flex items-center justify-between text-xs font-black text-haven-blue">
              <span>{{ formatEventDate(item.start_date) }}</span>
              <span class="text-haven-blue/60 font-bold">{{
                  formatEventTime(item.start_date, item.end_date)
                }}</span>
            </div>

            <p class="text-xs text-slate-600 font-medium leading-relaxed flex-1">
              {{ item.short_description || stripHtml(item.description) }}
            </p>
          </div>
        </div>
      </div>

      <div v-else-if="agendasList.length > 0" class="text-xs text-center italic text-slate-400 py-10">
        {{ $t('agendas.empty_agenda')}}
      </div>

      <div v-if="nextPageUrl" class="pt-4 text-center">
        <button
            @click="fetchAgendaData(true)"
            :disabled="isLoadingMore"
            class="px-6 py-2.5 border-2 border-haven-blue bg-white text-haven-blue text-xs font-black uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_#091d4b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
        >
          {{ isLoadingMore ? $t('agendas.load_more_loading') : `${$t('agendas.load_more_action')} 🔽` }}
        </button>
      </div>

    </div>
  </AppLayout>
</template>