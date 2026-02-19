import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Venue } from '~/domain/entities/Venue'
import type { BoundingBox } from '~/domain/repositories/VenueRepository'

const DEFAULT_CENTER: [number, number] = [41.39, 2.1] // Barcelona
const DEFAULT_ZOOM = 15

export const useMapExplorerStore = defineStore('mapExplorer', () => {
  // State
  const initialized = ref(false)
  const mapCenter = ref<[number, number]>(DEFAULT_CENTER)
  const mapZoom = ref(DEFAULT_ZOOM)
  const currentBounds = ref<BoundingBox | null>(null)
  const selectedVenueId = ref<string | null>(null)
  const selectedVenue = ref<Venue | null>(null)
  const showVenueDetail = ref(false)

  // Actions
  function setMapCenter(center: [number, number]) {
    mapCenter.value = center
  }

  function setMapZoom(zoom: number) {
    mapZoom.value = zoom
  }

  function setCurrentBounds(bounds: BoundingBox | null) {
    currentBounds.value = bounds
  }

  function setSelectedVenueId(id: string | null) {
    selectedVenueId.value = id
  }

  function setSelectedVenue(venue: Venue | null) {
    selectedVenue.value = venue
  }

  function setShowVenueDetail(show: boolean) {
    showVenueDetail.value = show
  }
  function setInitialized(value: boolean) {
    initialized.value = value
  }
  return {
    // State
    initialized,
    mapCenter,
    mapZoom,
    currentBounds,
    selectedVenueId,
    selectedVenue,
    showVenueDetail,

    // Actions
    setInitialized,
    setMapCenter,
    setMapZoom,
    setCurrentBounds,
    setSelectedVenueId,
    setSelectedVenue,
    setShowVenueDetail
  }
})
