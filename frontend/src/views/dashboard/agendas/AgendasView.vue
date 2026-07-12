<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import {onMounted, ref} from "vue";
import {agendaService} from "@/services/agendaService.js";
import type {Agenda} from "@/types/agenda.js";
import PageTitle from "@/components/utils/PageTitle.vue";

const agendasList = ref<Agenda[]>([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const errorMessage = ref<string | null>(null)
const selectedAgendaId = ref<number | 'all'>('all')
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

onMounted(() => {
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
            @click="selectedAgendaId = 'all'"
            class="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-haven-blue transition-all whitespace-nowrap cursor-pointer transform active:scale-95"
            :class="selectedAgendaId === 'all' ? 'bg-haven-blue text-white shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-haven-blue shadow-[3px_3px_0px_0px_#091d4b]'"
        >
          <span>📅</span> <span>{{ $t('agendas.show_all')}}</span>
        </button>

        <button
            v-for="agenda in agendasList"
            :key="agenda.id"
            @click="selectedAgendaId = agenda.id"
            class="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-haven-blue transition-all whitespace-nowrap cursor-pointer transform active:scale-95"
            :class="selectedAgendaId === agenda.id ? 'bg-haven-blue text-white shadow-none translate-x-0.5 translate-y-0.5' : 'bg-white text-haven-blue shadow-[3px_3px_0px_0px_#091d4b]'"
        >
          <span>📆</span> <span>{{ agenda.name }}</span>
        </button>
      </div>

      <div v-if="agendasList.length > 0" class="space-y-8">
        <div
            v-for="agenda in agendasList"
            :key="agenda.id"
            v-show="selectedAgendaId === 'all' || selectedAgendaId === agenda.id"
            class="space-y-4"
        >
          <div class="flex items-center justify-between border-b-2 border-haven-blue/10 pb-2 pl-1">
            <h2 class="text-sm font-black uppercase tracking-wider text-haven-blue">{{ agenda.name }}</h2>
            <span class="text-xs font-bold text-slate-400">{{ agenda.slug }}</span>
          </div>

          <div v-if="agenda.items && agenda.items.length > 0" class="space-y-4">
            <div
                v-for="item in agenda.items"
                :key="item.id"
                class="bg-white border-2 border-haven-blue rounded-2xl p-5 shadow-[4px_4px_0px_0px_#091d4b] flex flex-col space-y-3"
            >
              <div class="flex items-start justify-between space-x-4">
                <div class="space-y-1">
                  <h3 class="text-base font-black text-haven-blue leading-tight">{{ item.title }}</h3>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-xs font-black text-haven-blue">{{
                      formatEventTime(item.start_date, item.end_date)
                    }}</p>
                </div>
              </div>

              <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  alt="Event cover banner"
                  class="w-full h-32 object-cover rounded-xl border border-haven-blue/20"
              />

              <p class="text-xs text-slate-600 font-medium leading-relaxed">
                {{ item.short_description || item.description }}
              </p>
            </div>
          </div>

          <div v-else class="text-xs text-center italic text-slate-400 py-2">
            {{ $t('agendas.empty_agenda')}}
          </div>
        </div>
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