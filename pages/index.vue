<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import type { Venue } from '~/domain/entities/Venue'
import type { BoundingBox } from '~/domain/repositories/VenueRepository'

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

// Refs
const mapRef = ref<{ flyTo: (lat: number, lng: number, zoom?: number) => void; closePopups: () => void } | null>(null)
const mapCenter = ref<[number, number]>([41.39, 2.1]) // Barcelona default
const mapZoom = ref(15)
const selectedVenueId = ref<string | null>(null)
const selectedVenue = ref<Venue | null>(null)
const showVenueDetail = ref(false)
const currentBounds = ref<BoundingBox | null>(null)

// Methods
const handleSearch = async (): Promise<void> => {
  if (!currentBounds.value) return

  await fetchVenuesByBoundingBox(currentBounds.value, selectedDateTime.value)

  // Update sun info for map center
  const centerLat = (currentBounds.value.north + currentBounds.value.south) / 2
  const centerLng = (currentBounds.value.east + currentBounds.value.west) / 2
  updateSunInfo(centerLat, centerLng, selectedDateTime.value)
}

const handleBoundsChanged = (bounds: BoundingBox): void => {
  currentBounds.value = bounds

  // Update sun info for new center
  const centerLat = (bounds.north + bounds.south) / 2
  const centerLng = (bounds.east + bounds.west) / 2
  updateSunInfo(centerLat, centerLng, selectedDateTime.value)
}

const handleDateTimeUpdate = async (datetime: Date): Promise<void> => {
  setDateTime(datetime)

  if (currentBounds.value) {
    await fetchVenuesByBoundingBox(currentBounds.value, datetime)
  }
}

const handleVenueClick = (venue: Venue): void => {
  // Close any open map popups before showing the dialog
  mapRef.value?.closePopups()
  selectedVenue.value = venue
  showVenueDetail.value = true
}

const handleVenueSelect = (venue: Venue): void => {
  selectedVenueId.value = venue.id
  mapRef.value?.flyTo(venue.coordinates.latitude, venue.coordinates.longitude, 17)
}

const handleLocateMe = async (): Promise<void> => {
  try {
    await getCurrentPosition()
    if (geoState.value.latitude && geoState.value.longitude) {
      mapCenter.value = [geoState.value.latitude, geoState.value.longitude]
      mapZoom.value = 16
      mapRef.value?.flyTo(geoState.value.latitude, geoState.value.longitude, 16)
    }
  } catch (e) {
    console.error('Failed to get location:', e)
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

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    console.error('Error:', newError)
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
