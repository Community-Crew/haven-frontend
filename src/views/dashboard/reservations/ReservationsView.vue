<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import PageTitle from "@/components/utils/PageTitle.vue";
import {onMounted, ref, watch} from "vue";
import LoadingPlaceholder from "@/components/utils/LoadingPlaceholder.vue";
import type {Reservation} from "@/types/reservations.js";
import {reservationService} from "@/services/reservationService.js";
import {roomService} from "@/services/roomService.js";
import {useI18n} from "vue-i18n";

const {t} = useI18n();

interface RoomMeta {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

const isLoading = ref(true);
const isSaving = ref(false);
const isCancellingId = ref<number | null>(null);

const reservations = ref<Reservation[]>([]);
const availableRooms = ref<RoomMeta[]>([]);

const editingId = ref<number | null>(null);
const editNameValue = ref<string>("");

const activeTimeline = ref<'upcoming' | 'past'>('upcoming');
const activeStatus = ref<string>('approved');
const selectedRoomSlug = ref<string>('');

const loadInitialData = async () => {
  try {
    const roomsResponse = await roomService.getRooms();
    availableRooms.value = roomsResponse.data || roomsResponse;
  } catch (error) {
    console.error("Failed to load global rooms catalogue:", error);
  }
};

const fetchReservations = async () => {
  isLoading.value = true;
  try {
    const nowIsoString = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Amsterdam'}).format(new Date());
    const params: Record<string, any> = {
      status: activeStatus.value
    };

    if (activeTimeline.value === 'upcoming') {
      params.start_at = nowIsoString;
    } else {
      params.end_at = nowIsoString;
    }

    if (selectedRoomSlug.value) {
      params.room_slug = selectedRoomSlug.value;
    }

    const response = await reservationService.getMyReservations(params);
    reservations.value = response.data || [];
  } catch (error) {
    console.error("Failed to load resident reservations:", error);
  } finally {
    isLoading.value = false;
  }
};

const getRoomMeta = (roomId: number) => {
  const found = availableRooms.value.find(r => r.id === roomId);
  return found ? found : {name: `${t('reservations.room_fallback')} #${roomId}`, icon: '🚪'};
};

const startEdit = (res: Reservation) => {
  editingId.value = res.id;
  editNameValue.value = res.name;
};

const cancelEdit = () => {
  editingId.value = null;
  editNameValue.value = "";
};

const saveEdit = async (id: number) => {
  if (!editNameValue.value.trim()) return;

  isSaving.value = true;
  try {
    await reservationService.updateReservation(id, {name: editNameValue.value});
    reservations.value = reservations.value.map(res =>
        res.id === id ? {...res, name: editNameValue.value} : res
    );
    cancelEdit();
  } catch (error) {
    console.error("Failed to save reservation name:", error);
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = async (id: number) => {
  if (!confirm(t('reservations.cancel_confirmation'))) {
    return;
  }

  isCancellingId.value = id;
  try {
    await reservationService.cancelReservation(id);

    reservations.value = reservations.value.map(res =>
        res.id === id ? {...res, status: 'cancelled'} : res
    );

    if (activeStatus.value !== 'cancelled') {
      reservations.value = reservations.value.filter(res => res.id !== id);
    }
  } catch (error) {
    console.error("Failed to cancel booking:", error);
  } finally {
    isCancellingId.value = null;
  }
};

onMounted(async () => {
  await loadInitialData();
  await fetchReservations();
});

watch([activeTimeline, activeStatus, selectedRoomSlug], () => {
  cancelEdit();
  fetchReservations();
});
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <PageTitle :title="$t('reservations.title')" :sub-title="$t('reservations.subtitle')"/>

      <div class="flex gap-4 border-b border-slate-100 dark:border-white/5">
        <button
            @click="activeTimeline = 'upcoming'"
            class="pb-3 text-base font-black border-b-2 transition-all px-2 cursor-pointer"
            :class="activeTimeline === 'upcoming' ? 'border-haven-red text-haven-red dark:text-haven-yellow dark:border-haven-yellow' : 'border-transparent text-slate-400 hover:text-slate-600'"
        >
          {{ $t('reservations.tabs.upcoming') }}
        </button>
        <button
            @click="activeTimeline = 'past'"
            class="pb-3 text-base font-black border-b-2 transition-all px-2 cursor-pointer"
            :class="activeTimeline === 'past' ? 'border-haven-red text-haven-red dark:text-haven-yellow dark:border-haven-yellow' : 'border-transparent text-slate-400 hover:text-slate-600'"
        >
          {{ $t('reservations.tabs.past') }}
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-2">
        <div class="flex flex-wrap gap-2">
          <button
              v-for="status in ['approved', 'pending', 'cancelled', 'rejected']"
              :key="status"
              @click="activeStatus = status"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer"
              :class="activeStatus === status ? 'bg-haven-blue text-white border-haven-blue dark:bg-haven-yellow dark:text-haven-blue dark:border-haven-yellow' : 'bg-white text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-transparent'"
          >
            {{ $t(`reservations.statuses.${status}`) }}
          </button>
        </div>

        <div class="w-full sm:w-auto flex items-center gap-2">
          <label for="room-filter" class="text-xs font-bold uppercase tracking-wider text-slate-400">
            {{ $t('reservations.filters.room_label') }}
          </label>
          <select id="room-filter" v-model="selectedRoomSlug"
                  class="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none cursor-pointer">
            <option value="">{{ $t('reservations.filters.all_rooms') }}</option>
            <option v-for="room in availableRooms" :key="room.id" :value="room.slug">{{ room.name }}</option>
          </select>
        </div>
      </div>

      <LoadingPlaceholder :is-loading="isLoading"/>

      <div v-if="!isLoading && reservations.length === 0"
           class="w-full text-center py-16 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 p-6">
        <span class="text-4xl block mb-3">🗓️</span>
        <p class="text-slate-500 dark:text-slate-400 font-bold">{{ $t('reservations.no_records') }}</p>
      </div>

      <div v-if="!isLoading && reservations.length > 0"
           class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-6">

        <div
            v-for="res in reservations"
            :key="res.id"
            class="bg-white border-2 border-haven-blue rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b] flex flex-col justify-between transition-all duration-200 relative group"
        >
          <div class="space-y-5">
            <div class="flex items-center justify-between">
              <div
                  class="h-14 w-14 rounded-2xl bg-haven-blue/5 dark:bg-white/10 flex items-center justify-center text-3xl">
                {{ getRoomMeta(res.room_id).icon || '🚪' }}
              </div>

              <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider"
                    :class="{'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400': res.status === 'approved', 'bg-haven-red/10 text-haven-red': res.status === 'cancelled' || res.status === 'rejected', 'bg-amber-500/10 text-amber-500': res.status === 'pending'}">
                {{ $t(`reservations.statuses.${res.status}`) }}
              </span>
            </div>

            <div class="space-y-3">
              <div v-if="editingId === res.id" class="flex flex-col gap-2 pt-1">
                <input
                    type="text"
                    v-model="editNameValue"
                    class="w-full px-3 py-2 text-base font-bold border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none dark:bg-slate-800 text-slate-800 dark:text-white"
                    :disabled="isSaving"
                    @keyup.enter="saveEdit(res.id)"
                    @keyup.esc="cancelEdit"
                />
                <div class="flex gap-2">
                  <button @click="saveEdit(res.id)" :disabled="isSaving"
                          class="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer active:scale-95">
                    {{ isSaving ? '...' : $t('reservations.actions.save') }}
                  </button>
                  <button @click="cancelEdit" :disabled="isSaving"
                          class="px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer active:scale-95">
                    {{ $t('reservations.actions.cancel') }}
                  </button>
                </div>
              </div>

              <div v-else class="flex justify-between items-start gap-3">
                <div class="space-y-0.5">
                  <h2 class="text-lg font-black text-slate-800 dark:text-slate-100 wrap-break-word line-clamp-2 leading-tight">
                    {{ res.name }}
                  </h2>
                  <p class="font-bold text-sm text-slate-400 dark:text-white/40">
                    {{ getRoomMeta(res.room_id).name }}
                  </p>
                </div>

                <button
                    v-if="(res.status === 'approved' || res.status === 'pending') && new Date(res.start_at) > new Date()"
                    @click="startEdit(res)"
                    class="text-sm opacity-0 group-hover:opacity-100 hover:text-haven-red transition-all cursor-pointer font-bold shrink-0 p-1"
                >
                  ✏️
                </button>
              </div>

              <div class="flex flex-col space-y-2 text-sm text-slate-500 dark:text-slate-400 font-semibold pt-2">
                <span class="flex items-center gap-2.5">
                  <span class="text-base">📅</span> {{ new Date(res.start_at).toLocaleDateString() }}
                </span>
                <span class="flex items-center gap-2.5">
                  <span class="text-base">⏰</span> {{
                    new Date(res.start_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  }} - {{ new Date(res.end_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) }}
                </span>
              </div>
            </div>

            <div
                v-if="(res.status === 'approved' || res.status === 'pending') && new Date(res.start_at) > new Date()"
                class="border-t border-slate-100 dark:border-white/5 mt-4 pt-4 flex items-center justify-end"
            >
              <button
                  @click="handleCancel(res.id)"
                  :disabled="isCancellingId === res.id"
                  class="px-4 py-2 bg-haven-red/10 text-haven-red hover:bg-haven-red hover:text-white disabled:opacity-50 rounded-xl text-sm font-black tracking-tight transition-all cursor-pointer active:scale-95"
              >
                {{ isCancellingId === res.id ? '...' : $t('reservations.actions.cancel_booking') }}
              </button>
            </div>

            <div
                v-else-if="new Date(res.start_at) <= new Date()"
                class="border-t border-slate-100 dark:border-white/5 mt-4 pt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-black italic"
            >
              <span class="flex items-center gap-1">🔒 {{ $t('reservations.archive.label') }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </AppLayout>
</template>