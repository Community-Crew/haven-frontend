<script setup lang="ts">
import AppLayout from "@/layouts/AppLayout.vue";
import PageTitle from "@/components/utils/PageTitle.vue";
import {computed, onMounted, ref, watch} from "vue";
import LoadingPlaceholder from "@/components/utils/LoadingPlaceholder.vue";
import type {Reservation, ReservationCheck} from "@/types/reservations.js";
import {reservationService} from "@/services/reservationService.js";
import {roomService} from "@/services/roomService.js";
import {useI18n} from "vue-i18n";
import {Camera, CameraResultType, CameraSource} from "@capacitor/camera";

const {t} = useI18n();

interface RoomMeta {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  checkin_example_photo_urls?: string[];
}

const isLoading = ref(true);
const isSaving = ref(false);
const isCancellingId = ref<number | null>(null);
const submittingCheckKey = ref<string | null>(null);
const checkErrors = ref<Record<number, string>>({});

const reservations = ref<Reservation[]>([]);
const availableRooms = ref<RoomMeta[]>([]);

const editingId = ref<number | null>(null);
const editNameValue = ref<string>("");

const activeTimeline = ref<'upcoming' | 'past'>('upcoming');
const activeStatus = ref<string>('approved');
const selectedRoomSlug = ref<string>('');

const currentPage = ref(1);
const lastPage = ref(1);

const checkPreview = ref<{ resId: number; type: 'check_in' | 'check_out' } | null>(null);
const checkPreviewReservation = computed(() => reservations.value.find(res => res.id === checkPreview.value?.resId) ?? null);
const openCheckPreview = (res: Reservation, type: 'check_in' | 'check_out') => {
  checkPreview.value = {resId: res.id, type};
};
const closeCheckPreview = () => {
  checkPreview.value = null;
};

const lightboxUrl = ref<string | null>(null);
const openLightbox = (url: string) => {
  lightboxUrl.value = url;
};
const closeLightbox = () => {
  lightboxUrl.value = null;
};

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
      status: activeStatus.value,
      page: currentPage.value
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
    lastPage.value = response.meta?.last_page || 1;
  } catch (error) {
    console.error("Failed to load resident reservations:", error);
  } finally {
    isLoading.value = false;
  }
};

const goToPage = (page: number) => {
  if (page < 1 || page > lastPage.value || page === currentPage.value) return;
  currentPage.value = page;
  fetchReservations();
};

const getRoomMeta = (roomId: number): Partial<RoomMeta> & {name: string} => {
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

const getCheck = (res: Reservation, type: 'check_in' | 'check_out') => {
  return res.checks?.find(check => check.type === type);
};

const isSubmittingCheck = (id: number, type: 'check_in' | 'check_out') => {
  return submittingCheckKey.value === `${id}-${type}`;
};

const checkStatusBadgeClasses = (status: ReservationCheck['verification_status']) => ({
  'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400': status === 'verified',
  'bg-haven-red/10 text-haven-red': status === 'rejected',
  'bg-amber-500/10 text-amber-500': status === 'pending',
});

// Mirrors ReservationCheckService::guardCanSubmit() on the backend: check-in
// only opens GRACE_MINUTES before the reservation starts and is refused
// outright once it has ended, and check-out closes CHECK_OUT_GRACE_HOURS
// after that - these just decide whether to show the button at all instead
// of letting the resident hit a 422.
const GRACE_MINUTES = 15;
const CHECK_OUT_GRACE_HOURS = 1;

const isCheckInWindowNotYetOpen = (res: Reservation) => {
  const opensAt = new Date(res.start_at);
  opensAt.setMinutes(opensAt.getMinutes() - GRACE_MINUTES);
  return new Date() < opensAt;
};

const isCheckInWindowClosed = (res: Reservation) => {
  return new Date() > new Date(res.end_at);
};

const isCheckOutWindowClosed = (res: Reservation) => {
  const deadline = new Date(res.end_at);
  deadline.setHours(deadline.getHours() + CHECK_OUT_GRACE_HOURS);
  return new Date() > deadline;
};

const pendingPhotoUrls = new WeakMap<File, string>();
const objectUrl = (file: File) => {
  let url = pendingPhotoUrls.get(file);
  if (!url) {
    url = URL.createObjectURL(file);
    pendingPhotoUrls.set(file, url);
  }
  return url;
};

const pendingCheckPhotos = ref<Record<string, File[]>>({});

const pendingKey = (res: Reservation, type: 'check_in' | 'check_out') => `${res.id}-${type}`;

const getPendingPhotos = (res: Reservation, type: 'check_in' | 'check_out') => {
  return pendingCheckPhotos.value[pendingKey(res, type)] || [];
};

// The native camera is the only capture source (CameraSource.Camera, no
// gallery/library option) so a resident can't just submit an old photo from
// their camera roll - see the "prevent fraudulent pictures" discussion.
// Camera.getPhoto() rejects when the user cancels the camera, which is a
// normal outcome here, not an error worth surfacing.
const takePhoto = async (res: Reservation, type: 'check_in' | 'check_out') => {
  let photo;

  try {
    photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 85,
    });
  } catch {
    return;
  }

  if (!photo.webPath) return;

  const blob = await (await fetch(photo.webPath)).blob();
  const format = photo.format || 'jpeg';
  const file = new File([blob], `photo-${Date.now()}.${format}`, {type: blob.type || `image/${format}`});

  const key = pendingKey(res, type);
  pendingCheckPhotos.value = {
    ...pendingCheckPhotos.value,
    [key]: [...(pendingCheckPhotos.value[key] || []), file],
  };
};

const confirmCheckPreview = async () => {
  const preview = checkPreview.value;
  const res = checkPreviewReservation.value;
  if (!preview || !res) return;

  closeCheckPreview();
  await takePhoto(res, preview.type);
};

const removePendingPhoto = (res: Reservation, type: 'check_in' | 'check_out', index: number) => {
  const key = pendingKey(res, type);
  const photos = [...(pendingCheckPhotos.value[key] || [])];
  photos.splice(index, 1);
  pendingCheckPhotos.value = {...pendingCheckPhotos.value, [key]: photos};
};

const submitPendingPhotos = async (res: Reservation, type: 'check_in' | 'check_out') => {
  const key = pendingKey(res, type);
  const photos = pendingCheckPhotos.value[key] || [];
  if (photos.length === 0) return;

  submittingCheckKey.value = key;
  const {[res.id]: _removed, ...remainingErrors} = checkErrors.value;
  checkErrors.value = remainingErrors;

  try {
    const response = type === 'check_in'
        ? await reservationService.checkIn(res.id, photos)
        : await reservationService.checkOut(res.id, photos);

    reservations.value = reservations.value.map(r => {
      if (r.id !== res.id) return r;
      const otherChecks = (r.checks || []).filter(check => check.type !== type);
      return {...r, checks: [...otherChecks, response.data]};
    });

    const {[key]: _removedPending, ...remainingPending} = pendingCheckPhotos.value;
    pendingCheckPhotos.value = remainingPending;
  } catch (error: any) {
    const validationErrors = error.response?.data?.errors;
    const photosErrors = validationErrors
        ? Object.keys(validationErrors)
            .filter(key => key === 'photos' || key.startsWith('photos.'))
            .flatMap(key => validationErrors[key])
        : [];
    checkErrors.value = {
      ...checkErrors.value,
      [res.id]: photosErrors[0] || error.response?.data?.message || t('reservations.checks.error_generic'),
    };
  } finally {
    submittingCheckKey.value = null;
  }
};

onMounted(async () => {
  await loadInitialData();
  await fetchReservations();
});

watch([activeTimeline, activeStatus, selectedRoomSlug], () => {
  cancelEdit();
  currentPage.value = 1;
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
            class="bg-white dark:bg-slate-800 border-2 border-haven-blue dark:border-white/10 rounded-2xl p-6 shadow-[4px_4px_0px_0px_#091d4b] dark:shadow-none flex flex-col justify-between transition-all duration-200 relative group"
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
                v-if="(res.status === 'approved' || res.status === 'pending') && new Date(res.start_at) > new Date() && !getCheck(res, 'check_in')"
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

            <div
                v-else-if="getCheck(res, 'check_in')"
                class="border-t border-slate-100 dark:border-white/5 mt-4 pt-4 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-black italic"
            >
              <span class="flex items-center gap-1">✅ {{ $t('reservations.checks.locked_after_check_in') }}</span>
            </div>

            <div
                v-if="res.checks !== undefined"
                class="border-t border-slate-100 dark:border-white/5 mt-4 pt-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-black uppercase tracking-wider text-slate-400">
                  {{ $t('reservations.checks.check_in_label') }}
                </span>

                <span
                    v-if="getCheck(res, 'check_in')"
                    class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    :class="checkStatusBadgeClasses(getCheck(res, 'check_in')!.verification_status)"
                >
                  {{ $t(`reservations.checks.statuses.${getCheck(res, 'check_in')!.verification_status}`) }}
                </span>

                <button
                    v-else-if="res.status === 'approved' && !isCheckInWindowClosed(res) && !isCheckInWindowNotYetOpen(res) && getPendingPhotos(res, 'check_in').length === 0"
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue"
                    :class="{'opacity-50 pointer-events-none': submittingCheckKey !== null}"
                    :disabled="submittingCheckKey !== null"
                    @click="openCheckPreview(res, 'check_in')"
                >
                  {{ $t('reservations.checks.actions.check_in') }}
                </button>

                <span
                    v-else-if="res.status === 'approved' && isCheckInWindowNotYetOpen(res)"
                    class="text-xs italic text-slate-400 dark:text-slate-500"
                >
                  {{ $t('reservations.checks.check_in_not_yet_open') }}
                </span>

                <span
                    v-else-if="res.status === 'approved' && isCheckInWindowClosed(res)"
                    class="text-xs italic text-slate-400 dark:text-slate-500"
                >
                  {{ $t('reservations.checks.check_in_unavailable') }}
                </span>
              </div>

              <div v-if="getPendingPhotos(res, 'check_in').length > 0" class="space-y-2">
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="(file, photoIndex) in getPendingPhotos(res, 'check_in')" :key="photoIndex" class="relative">
                    <img
                        :src="objectUrl(file)"
                        alt=""
                        class="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95 transition-all"
                        @click="openLightbox(objectUrl(file))"
                    />
                    <button
                        type="button"
                        class="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-haven-red text-white text-[10px] font-black leading-none flex items-center justify-center cursor-pointer"
                        :disabled="submittingCheckKey !== null"
                        @click="removePendingPhoto(res, 'check_in', photoIndex)"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
                      :disabled="submittingCheckKey !== null"
                      @click="takePhoto(res, 'check_in')"
                  >
                    {{ $t('reservations.checks.actions.add_photo') }}
                  </button>
                  <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue cursor-pointer active:scale-95"
                      :disabled="submittingCheckKey !== null"
                      @click="submitPendingPhotos(res, 'check_in')"
                  >
                    {{ isSubmittingCheck(res.id, 'check_in') ? $t('reservations.checks.actions.uploading') : $t('reservations.checks.actions.submit') }}
                  </button>
                </div>
              </div>

              <div
                  v-if="getCheck(res, 'check_in')?.image_urls.length"
                  class="flex flex-wrap gap-1.5"
              >
                <img
                    v-for="(url, photoIndex) in getCheck(res, 'check_in')!.image_urls"
                    :key="photoIndex"
                    :src="url"
                    alt=""
                    class="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95 transition-all"
                    @click="openLightbox(url)"
                />
              </div>
              <p
                  v-if="getCheck(res, 'check_in')?.verification_status === 'rejected'"
                  class="text-xs font-semibold text-haven-red"
              >
                {{ $t('reservations.checks.rejection_note_prefix') }}{{ getCheck(res, 'check_in')!.rejection_note }}
              </p>

              <div v-if="getCheck(res, 'check_in')" class="flex items-center justify-between gap-2">
                <span class="text-xs font-black uppercase tracking-wider text-slate-400">
                  {{ $t('reservations.checks.check_out_label') }}
                </span>

                <span
                    v-if="getCheck(res, 'check_out')"
                    class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                    :class="checkStatusBadgeClasses(getCheck(res, 'check_out')!.verification_status)"
                >
                  {{ $t(`reservations.checks.statuses.${getCheck(res, 'check_out')!.verification_status}`) }}
                </span>

                <button
                    v-else-if="res.status === 'approved' && !isCheckOutWindowClosed(res) && getPendingPhotos(res, 'check_out').length === 0"
                    type="button"
                    class="px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-all bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue"
                    :class="{'opacity-50 pointer-events-none': submittingCheckKey !== null}"
                    :disabled="submittingCheckKey !== null"
                    @click="openCheckPreview(res, 'check_out')"
                >
                  {{ $t('reservations.checks.actions.check_out') }}
                </button>

                <span
                    v-else-if="res.status === 'approved' && isCheckOutWindowClosed(res)"
                    class="text-xs italic text-slate-400 dark:text-slate-500"
                >
                  {{ $t('reservations.checks.check_out_window_closed') }}
                </span>
              </div>
              <div
                  v-else-if="res.status === 'approved'"
                  class="flex items-center justify-between gap-2"
              >
                <span class="text-xs font-black uppercase tracking-wider text-slate-400">
                  {{ $t('reservations.checks.check_out_label') }}
                </span>
                <span class="text-xs italic text-slate-400 dark:text-slate-500">
                  {{ $t('reservations.checks.check_out_unavailable') }}
                </span>
              </div>

              <div v-if="getPendingPhotos(res, 'check_out').length > 0" class="space-y-2">
                <div class="flex flex-wrap gap-1.5">
                  <div v-for="(file, photoIndex) in getPendingPhotos(res, 'check_out')" :key="photoIndex" class="relative">
                    <img
                        :src="objectUrl(file)"
                        alt=""
                        class="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95 transition-all"
                        @click="openLightbox(objectUrl(file))"
                    />
                    <button
                        type="button"
                        class="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-haven-red text-white text-[10px] font-black leading-none flex items-center justify-center cursor-pointer"
                        :disabled="submittingCheckKey !== null"
                        @click="removePendingPhoto(res, 'check_out', photoIndex)"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
                      :disabled="submittingCheckKey !== null"
                      @click="takePhoto(res, 'check_out')"
                  >
                    {{ $t('reservations.checks.actions.add_photo') }}
                  </button>
                  <button
                      type="button"
                      class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue cursor-pointer active:scale-95"
                      :disabled="submittingCheckKey !== null"
                      @click="submitPendingPhotos(res, 'check_out')"
                  >
                    {{ isSubmittingCheck(res.id, 'check_out') ? $t('reservations.checks.actions.uploading') : $t('reservations.checks.actions.submit') }}
                  </button>
                </div>
              </div>

              <div
                  v-if="getCheck(res, 'check_out')?.image_urls.length"
                  class="flex flex-wrap gap-1.5"
              >
                <img
                    v-for="(url, photoIndex) in getCheck(res, 'check_out')!.image_urls"
                    :key="photoIndex"
                    :src="url"
                    alt=""
                    class="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-white/10 cursor-pointer active:scale-95 transition-all"
                    @click="openLightbox(url)"
                />
              </div>
              <p
                  v-if="getCheck(res, 'check_out')?.verification_status === 'rejected'"
                  class="text-xs font-semibold text-haven-red"
              >
                {{ $t('reservations.checks.rejection_note_prefix') }}{{ getCheck(res, 'check_out')!.rejection_note }}
              </p>

              <p v-if="checkErrors[res.id]" class="text-xs font-semibold text-haven-red">
                {{ checkErrors[res.id] }}
              </p>

              <div v-if="res.notes && res.notes.length > 0" class="space-y-1 pt-1">
                <p
                    v-for="(note, noteIndex) in res.notes"
                    :key="noteIndex"
                    class="text-xs italic text-slate-500 dark:text-slate-400"
                >
                  {{ $t('reservations.notes.from_management', {body: note.body}) }}
                  — {{ new Date(note.created_at).toLocaleDateString() }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-if="!isLoading && lastPage > 1" class="flex items-center justify-center gap-3 pt-2">
        <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-transparent active:scale-95"
        >
          {{ $t('reservations.pagination.previous') }}
        </button>

        <span class="text-xs font-bold text-slate-400 dark:text-slate-500">
          {{ $t('reservations.pagination.page_of', {current: currentPage, total: lastPage}) }}
        </span>

        <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === lastPage"
            class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-transparent active:scale-95"
        >
          {{ $t('reservations.pagination.next') }}
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
          v-if="checkPreviewReservation && checkPreview"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          @click.self="closeCheckPreview"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
          <h3 class="text-base font-black text-slate-800 dark:text-slate-100">
            {{ $t('reservations.checks.example_modal.title') }}
          </h3>

          <div
              v-if="getRoomMeta(checkPreviewReservation.room_id).checkin_example_photo_urls?.length"
              class="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto"
          >
            <img
                v-for="(url, photoIndex) in getRoomMeta(checkPreviewReservation.room_id).checkin_example_photo_urls"
                :key="photoIndex"
                :src="url"
                alt=""
                class="w-full aspect-square rounded-xl object-cover cursor-pointer active:scale-95 transition-all"
                @click="openLightbox(url)"
            />
          </div>

          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{
              getRoomMeta(checkPreviewReservation.room_id).checkin_example_photo_urls?.length
                  ? $t('reservations.checks.example_modal.description_with_example')
                  : $t('reservations.checks.example_modal.description_no_example')
            }}
          </p>

          <div class="flex gap-2 justify-end">
            <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer active:scale-95"
                @click="closeCheckPreview"
            >
              {{ $t('reservations.checks.example_modal.cancel') }}
            </button>
            <button
                type="button"
                class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-haven-blue text-white dark:bg-haven-yellow dark:text-haven-blue cursor-pointer active:scale-95"
                @click="confirmCheckPreview"
            >
              {{ $t('reservations.checks.example_modal.continue') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
          v-if="lightboxUrl"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          @click="closeLightbox"
      >
        <img
            :src="lightboxUrl"
            alt=""
            class="max-w-full max-h-full rounded-xl object-contain"
        />
      </div>
    </Teleport>
  </AppLayout>
</template>