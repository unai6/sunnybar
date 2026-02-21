<script setup lang="ts">
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
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
    <MobileTopBar />

    <!-- Mobile Bottom Action Bar -->
    <MobileBottomActionBar
      :loading="loading"
      :venues-count="filteredVenues.length"
      @search="handleSearch"
      @locate="onLocateMe"
      @show-venues="showVenuesDrawer = true"
    />

    <!-- Mobile Venues Bottom Drawer -->
    <MobileVenuesDrawer
      v-model:visible="showVenuesDrawer"
      :venues="filteredVenues"
      :selected-venue-id="selectedVenueId"
      :loading="loading"
      @venue-select="handleVenueSelect"
    />

    <!-- Desktop Layout -->
    <div class="h-full lg:grid lg:grid-cols-[320px_1fr_300px] gap-0">
      <!-- Control Panel (desktop only) -->
      <aside class="hidden lg:block border-r border-gray-200 overflow-y-auto" aria-label="Search controls">
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
        :style="{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }"
        :class="{ 'lg:!p-0': true }"
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
          class="lg:hidden absolute bottom-0 left-2 right-2 z-[200] pointer-events-auto"
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
