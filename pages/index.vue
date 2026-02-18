<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import type { Venue } from '~/domain/entities/Venue'
import type { BoundingBox } from '~/domain/repositories/VenueRepository'

const toast = useToast()
const { t } = useI18n()

// Composables
const {
  loading,
  error,
  filters,
  sunnyVenues,
  shadedVenues,
  filteredVenues,
  fetchVenuesByBoundingBox,
  setFilters
} = useVenues()

const {
  sunInfo,
  selectedDateTime,
  updateSunInfo,
  setDateTime
} = useSunInfo()

const { state: geoState, getCurrentPosition } = useGeolocation()

// Constants
const DEFAULT_CENTER: [number, number] = [41.39, 2.1] // Barcelona
const DEFAULT_ZOOM = 15
const LOCATE_ME_ZOOM = 16
const VENUE_SELECT_ZOOM = 17
const TOAST_DURATION_MS = 5000

// Refs
const mapRef = ref<{ flyTo: (lat: number, lng: number, zoom?: number) => void; closePopups: () => void } | null>(null)
const mapCenter = ref<[number, number]>(DEFAULT_CENTER)
const mapZoom = ref(DEFAULT_ZOOM)
const selectedVenueId = ref<string | null>(null)
const selectedVenue = ref<Venue | null>(null)
const showVenueDetail = ref(false)
const currentBounds = ref<BoundingBox | null>(null)

// Methods
async function handleSearch(): Promise<void> {
  if (!currentBounds.value) return

  await fetchVenuesByBoundingBox(currentBounds.value, selectedDateTime.value)

  // Update sun info for map center
  const centerLat = (currentBounds.value.north + currentBounds.value.south) / 2
  const centerLng = (currentBounds.value.east + currentBounds.value.west) / 2
  updateSunInfo(centerLat, centerLng, selectedDateTime.value)
}

function handleBoundsChanged(bounds: BoundingBox): void {
  currentBounds.value = bounds

  // Update sun info for new center
  const centerLat = (bounds.north + bounds.south) / 2
  const centerLng = (bounds.east + bounds.west) / 2
  updateSunInfo(centerLat, centerLng, selectedDateTime.value)
}

async function handleDateTimeUpdate(datetime: Date): Promise<void> {
  setDateTime(datetime)

  if (currentBounds.value) {
    // Update sun position panel for the new time
    const centerLat = (currentBounds.value.north + currentBounds.value.south) / 2
    const centerLng = (currentBounds.value.east + currentBounds.value.west) / 2
    updateSunInfo(centerLat, centerLng, datetime)

    // Re-fetch venues with updated shadow analysis
    await fetchVenuesByBoundingBox(currentBounds.value, datetime)
  }
}

function handleVenueClick(venue: Venue): void {
  // Close any open map popups before showing the dialog
  mapRef.value?.closePopups()
  selectedVenue.value = venue
  showVenueDetail.value = true
}

function handleVenueSelect(venue: Venue): void {
  selectedVenueId.value = venue.id
  mapRef.value?.flyTo(venue.coordinates.latitude, venue.coordinates.longitude, VENUE_SELECT_ZOOM)
}

async function handleLocateMe(): Promise<void> {
  try {
    await getCurrentPosition()
    if (geoState.value.latitude && geoState.value.longitude) {
      mapCenter.value = [geoState.value.latitude, geoState.value.longitude]
      mapZoom.value = LOCATE_ME_ZOOM
      mapRef.value?.flyTo(geoState.value.latitude, geoState.value.longitude, LOCATE_ME_ZOOM)
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: t('toast.error.title'),
      detail: t('toast.error.geolocation'),
      life: TOAST_DURATION_MS
    })
  }
}

// Initialize with user location if available
onMounted(async () => {
  try {
    await getCurrentPosition()
    if (geoState.value.latitude && geoState.value.longitude) {
      mapCenter.value = [geoState.value.latitude, geoState.value.longitude]
      updateSunInfo(geoState.value.latitude, geoState.value.longitude)
    }
  } catch {
    // Use default location (Madrid)
    updateSunInfo(mapCenter.value[0], mapCenter.value[1])
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr_300px] h-full gap-0">
    <!-- Control Panel -->
    <aside class="border-r border-gray-200 overflow-y-auto order-1 md:order-1" aria-label="Search controls">
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
        @update-filters="setFilters"
        @locate-me="handleLocateMe"
      />
    </aside>

    <!-- Map -->
    <div class="relative h-full order-2 md:order-2">
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
    </div>

    <!-- Venue List Sidebar -->
    <aside class="hidden lg:block border-l border-gray-200 overflow-y-auto order-3" aria-label="Venue results">
      <VenueList
        :venues="filteredVenues"
        :selected-venue-id="selectedVenueId"
        :loading="loading"
        @venue-select="handleVenueSelect"
      />
    </aside>

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
