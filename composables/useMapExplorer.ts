import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import type { VenueErrorCode } from '~/shared/enums/venue-error-code'
import type { BoundingBox, MapRef, Venue, VenueFilters } from '~/shared/types'
import { useMapExplorerStore } from '~/stores/mapExplorer'

const LOCATE_ME_ZOOM = 16
const VENUE_SELECT_ZOOM = 17

/**
 * useMapExplorer Composable
 * Manages map exploration state and coordinates between map, venues, and sun info
 * This is the main orchestrator composable for the map page
 */
export function useMapExplorer() {
  // Other composables
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

  // Map state from store
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

  /**
   * Handle bounds change from the map
   */
  function handleBoundsChanged(bounds: BoundingBox): void {
    mapStore.currentBounds = bounds

    const { lat, lng } = getBoundsCenter(bounds)
    updateSunInfo(lat, lng, selectedDateTime.value)
  }

  /**
   * Handle date/time update
   */
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

  /**
   * Handle filter update
   */
  async function handleFilterUpdate(
    newFilters: Partial<VenueFilters>
  ): Promise<VenueErrorCode | null> {
    setFilters(newFilters)
    return handleSearch()
  }

  /**
   * Handle venue click on the map
   */
  function handleVenueClick(venue: Venue): void {
    mapRef.value?.closePopups()
    mapStore.selectedVenue = venue
    mapStore.selectedVenueId = venue.id
    mapStore.showVenueDetail = true
  }

  /**
   * Handle venue selection from the list
   */
  function handleVenueSelect(venue: Venue): void {
    mapStore.selectedVenueId = venue.id
    mapRef.value?.flyTo(
      venue.coordinates.latitude,
      venue.coordinates.longitude,
      VENUE_SELECT_ZOOM
    )
  }

  /**
   * Handle "locate me" button click
   */
  async function handleLocateMe(): Promise<void> {
    await getCurrentPosition()
    if (geoState.value.latitude && geoState.value.longitude) {
      mapStore.mapCenter = [geoState.value.latitude, geoState.value.longitude]
      mapStore.mapZoom = LOCATE_ME_ZOOM
      mapRef.value?.flyTo(
        geoState.value.latitude,
        geoState.value.longitude,
        LOCATE_ME_ZOOM
      )
      mapRef.value?.setUserLocation(
        geoState.value.latitude,
        geoState.value.longitude
      )
    }
  }

  /**
   * Initialize the map explorer
   */
  async function initialize(): Promise<void> {
    // Prevent re-initialization on locale change
    if (mapStore.initialized) {
      return
    }

    const { error } = await attempt(() => getCurrentPosition())

    if (!error && geoState.value.latitude && geoState.value.longitude) {
      mapStore.mapCenter = [geoState.value.latitude, geoState.value.longitude]
      updateSunInfo(geoState.value.latitude, geoState.value.longitude)
    } else {
      updateSunInfo(mapCenter.value[0], mapCenter.value[1])
    }

    mapStore.initialized = true
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
