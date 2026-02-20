<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import ProgressSpinner from 'primevue/progressspinner'
import { ref } from 'vue'
import { VenueErrorCode } from '~/composables/useVenues'

enum ToastSeverity {
  ERROR = 'error',
  WARN = 'warn'
}

const toast = useToast()
const { t } = useI18n()

// Mobile bottom drawer state
const showVenuesDrawer = ref(false)

const TOAST_DURATION_MS = 5000

const ERROR_TOAST_MAP: Record<VenueErrorCode, { severity: ToastSeverity; key: string }> = {
  [VenueErrorCode.BBOX_TOO_LARGE]: { severity: ToastSeverity.WARN, key: 'toast.error.bboxTooLarge' },
  [VenueErrorCode.NETWORK]: { severity: ToastSeverity.ERROR, key: 'toast.error.network' },
  [VenueErrorCode.FETCH_FAILED]: { severity: ToastSeverity.ERROR, key: 'toast.error.fetchVenues' }
}

const {
  loading,
  filters,
  sunnyVenues,
  shadedVenues,
  filteredVenues,
  sunInfo,
  selectedDateTime,
  mapRef,
  mapCenter,
  mapZoom,
  selectedVenueId,
  selectedVenue,
  showVenueDetail,
  handleSearch: search,
  handleBoundsChanged,
  handleDateTimeUpdate: updateDateTime,
  handleFilterUpdate: updateFilters,
  handleVenueClick,
  handleVenueSelect,
  handleLocateMe,
  initialize
} = useMapExplorer()

onMounted(async () => {
  await initialize()
})

function showVenueError(errorCode: VenueErrorCode): void {
  const { severity, key } = ERROR_TOAST_MAP[errorCode]
  toast.add({
    severity,
    summary: t('toast.error.title'),
    detail: t(key),
    life: TOAST_DURATION_MS
  })
}

async function handleSearch(): Promise<void> {
  const errorCode = await search()
  if (errorCode) showVenueError(errorCode)
}

async function handleDateTimeUpdate(datetime: Date): Promise<void> {
  const errorCode = await updateDateTime(datetime)
  if (errorCode) showVenueError(errorCode)
}

async function handleFilterUpdate(newFilters: Parameters<typeof updateFilters>[0]): Promise<void> {
  const errorCode = await updateFilters(newFilters)
  if (errorCode) showVenueError(errorCode)
}

async function onLocateMe(): Promise<void> {
  const { error } = await attempt(() => handleLocateMe())
  if (error) {
    console.error('Geolocation error:', error)
    toast.add({
      severity: ToastSeverity.ERROR,
      summary: t('toast.error.title'),
      detail: t('toast.error.geolocation'),
      life: TOAST_DURATION_MS
    })
  }
}
</script>

<template>
  <div class="relative h-full">
    <!-- Mobile Top Bar -->
    <div
      class="md:hidden fixed top-0 left-0 right-0 z-[300] bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between"
      style="padding-top: calc(0.75rem + env(safe-area-inset-top, 0px))"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-sun text-xl text-amber-500" />
        <span class="text-lg font-bold bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">
          SunBar
        </span>
      </div>
      <LocaleSwitcher />
    </div>

    <!-- Mobile Bottom Action Bar -->
    <div
      class="md:hidden fixed bottom-0 left-0 right-0 z-[300] bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]"
      style="padding-bottom: env(safe-area-inset-bottom, 0px)"
    >
      <div class="grid grid-cols-3 gap-1 p-1.5">
        <!-- Search Area Button -->
        <button
          :disabled="loading"
          class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
          :class="loading ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white active:bg-amber-600'"
          @click="handleSearch"
        >
          <i :class="loading ? 'pi pi-spin pi-spinner text-base' : 'pi pi-refresh text-base'" />
          <span class="text-[10px] mt-0.5 font-medium">{{ $t('controlPanel.mobile.search') }}</span>
        </button>

        <!-- Locate Me Button -->
        <button
          class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
          @click="onLocateMe"
        >
          <i class="pi pi-map-marker text-base" />
          <span class="text-[10px] mt-0.5">{{ $t('controlPanel.mobile.locate') }}</span>
        </button>

        <!-- Venues List Button -->
        <button
          class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200 relative"
          @click="showVenuesDrawer = true"
        >
          <i class="pi pi-list text-base" />
          <span class="text-[10px] mt-0.5">{{ $t('controlPanel.mobile.venues') }}</span>
          <span
            v-if="filteredVenues.length > 0"
            class="absolute top-0.5 right-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
          >
            {{ filteredVenues.length > 99 ? '99+' : filteredVenues.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Mobile Venues Bottom Drawer -->
    <Drawer
      v-model:visible="showVenuesDrawer"
      position="bottom"
      class="md:hidden !h-full"
      :show-close-icon="false"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <i class="pi pi-list text-amber-500" />
            {{ $t('venueList.title.nearbyVenues') }}
            <span class="text-sm text-gray-500">({{ filteredVenues.length }})</span>
          </h2>
          <button
            class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            @click="showVenuesDrawer = false"
          >
            <i class="pi pi-times" />
          </button>
        </div>
      </template>
      <VenueList
        :venues="filteredVenues"
        :selected-venue-id="selectedVenueId"
        :loading="loading"
        @venue-select="(v) => { handleVenueSelect(v); showVenuesDrawer = false }"
      />
    </Drawer>

    <!-- Desktop Layout -->
    <div class="h-full md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr_300px] gap-0">
      <!-- Control Panel (desktop only) -->
      <aside class="hidden md:block border-r border-gray-200 overflow-y-auto" aria-label="Search controls">
        <ControlPanel
          :loading="loading"
          :venues-count="filteredVenues.length"
          :sunny-count="sunnyVenues.length"
          :shaded-count="shadedVenues.length"
          :sun-info="sunInfo"
          :selected-date-time="selectedDateTime"
          :filters="filters"
          @search="handleSearch"
          @update-datetime="handleDateTimeUpdate"
          @update-filters="handleFilterUpdate"
          @locate-me="onLocateMe"
        />
      </aside>

      <!-- Map (always rendered, single instance) -->
      <div
        class="relative h-full"
        :style="{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }"
        :class="{ 'md:!p-0': true }"
      >
        <div v-if="loading" class="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <ProgressSpinner />
        </div>

        <ArcGISMap
          ref="mapRef"
          :venues="filteredVenues"
          :center="mapCenter"
          :zoom="mapZoom"
          :selected-date-time="selectedDateTime"
          @bounds-changed="handleBoundsChanged"
          @venue-click="handleVenueClick"
        />

        <!-- Mobile Map Controls Overlay -->
        <div
          class="md:hidden absolute bottom-0 left-2 right-2 z-[200] pointer-events-auto"
          style="padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px))"
        >
          <MapControls
            :selected-date-time="selectedDateTime"
            :filters="filters"
            :sunny-count="sunnyVenues.length"
            :shaded-count="shadedVenues.length"
            @update-datetime="handleDateTimeUpdate"
            @update-filters="handleFilterUpdate"
          />
        </div>
      </div>

      <!-- Venue List Sidebar (desktop only) -->
      <aside class="hidden lg:block border-l border-gray-200 overflow-y-auto" aria-label="Venue results">
        <VenueList
          :venues="filteredVenues"
          :selected-venue-id="selectedVenueId"
          :loading="loading"
          @venue-select="handleVenueSelect"
        />
      </aside>
    </div>

    <!-- Venue Detail Dialog -->
    <Dialog
      v-model:visible="showVenueDetail"
      :header="selectedVenue?.name || $t('venueDetail.title.venueDetails')"
      :modal="true"
      :dismissable-mask="true"
      :closable="true"
      :draggable="false"
      class="venue-dialog"
    >
      <VenueDetail v-if="selectedVenue" :venue="selectedVenue" />
    </Dialog>
  </div>
</template>
