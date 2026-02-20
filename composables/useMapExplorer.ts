import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { Venue } from '~/domain/entities/Venue'
import type {
  BoundingBox,
  MapRef,
  VenueErrorCode,
  VenueFilters
} from '~/shared/types'
import { useMapExplorerStore } from '~/stores/mapExplorer'

const LOCATE_ME_ZOOM = 16
const VENUE_SELECT_ZOOM = 17

export function useMapExplorer() {
  // Composables
  const {
    loading,
    filters,
    sunnyVenues,
    shadedVenues,
    filteredVenues,
    fetchVenuesByBoundingBox,
    setFilters
  } = useVenues()

  const { sunInfo, selectedDateTime, updateSunInfo, setDateTime } =
    useSunInfo()

  const { state: geoState, getCurrentPosition } = useGeolocation()

  // Use Pinia store for framework-agnostic state management
  const mapStore = useMapExplorerStore()
  const {
    mapCenter,
    mapZoom,
    currentBounds,
    selectedVenueId,
    selectedVenue,
    showVenueDetail
  } = storeToRefs(mapStore)

  const mapRef = ref<MapRef | null>(null)

  // Helpers
  function getBoundsCenter(bounds: BoundingBox): { lat: number; lng: number } {
    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    }
  }

  // Actions
  async function handleSearch(): Promise<VenueErrorCode | null> {
    if (!currentBounds.value) return null

    const errorCode = await fetchVenuesByBoundingBox(
      currentBounds.value,
      selectedDateTime.value
    )

    const { lat, lng } = getBoundsCenter(currentBounds.value)
    updateSunInfo(lat, lng, selectedDateTime.value)

    return errorCode
  }

  function handleBoundsChanged(bounds: BoundingBox): void {
    mapStore.setCurrentBounds(bounds)

    const { lat, lng } = getBoundsCenter(bounds)
    updateSunInfo(lat, lng, selectedDateTime.value)
  }

  async function handleDateTimeUpdate(
    datetime: Date
  ): Promise<VenueErrorCode | null> {
    setDateTime(datetime)

    if (currentBounds.value) {
      const { lat, lng } = getBoundsCenter(currentBounds.value)
      updateSunInfo(lat, lng, datetime)

      return fetchVenuesByBoundingBox(currentBounds.value, datetime)
    }

    return null
  }

  async function handleFilterUpdate(
    newFilters: Partial<VenueFilters>
  ): Promise<VenueErrorCode | null> {
    setFilters(newFilters)
    return handleSearch()
  }

  function handleVenueClick(venue: Venue): void {
    mapRef.value?.closePopups()
    mapStore.setSelectedVenue(venue)
    mapStore.setShowVenueDetail(true)
  }

  function handleVenueSelect(venue: Venue): void {
    mapStore.setSelectedVenueId(venue.id)
    mapRef.value?.flyTo(
      venue.coordinates.latitude,
      venue.coordinates.longitude,
      VENUE_SELECT_ZOOM
    )
  }

  async function handleLocateMe(): Promise<void> {
    await getCurrentPosition()
    if (geoState.value.latitude && geoState.value.longitude) {
      mapStore.setMapCenter([
        geoState.value.latitude,
        geoState.value.longitude
      ])
      mapStore.setMapZoom(LOCATE_ME_ZOOM)
      mapRef.value?.flyTo(
        geoState.value.latitude,
        geoState.value.longitude,
        LOCATE_ME_ZOOM
      )
    }
  }

  // Initialization function to be called from component
  async function initialize(): Promise<void> {
    // Prevent re-initialization on locale change
    if (mapStore.initialized) {
      return
    }

    const { error } = await attempt(() => getCurrentPosition())

    if (!error && geoState.value.latitude && geoState.value.longitude) {
      mapStore.setMapCenter([
        geoState.value.latitude,
        geoState.value.longitude
      ])
      updateSunInfo(geoState.value.latitude, geoState.value.longitude)
    } else {
      updateSunInfo(mapCenter.value[0], mapCenter.value[1])
    }

    mapStore.setInitialized(true)
  }

  return {
    // State
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

    // Actions
    handleSearch,
    handleBoundsChanged,
    handleDateTimeUpdate,
    handleFilterUpdate,
    handleVenueClick,
    handleVenueSelect,
    handleLocateMe,
    initialize
  }
}
