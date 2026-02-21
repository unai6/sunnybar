import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BoundingBox, Venue } from '~/shared/types'

const DEFAULT_CENTER: [number, number] = [41.39, 2.1] // Barcelona
const DEFAULT_ZOOM = 15

/**
 * Map Explorer Store
 * Holds shared state for map exploration across the app
 * Business logic is handled in the useMapExplorer composable
 */
export const useMapExplorerStore = defineStore('mapExplorer', () => {
  const initialized = ref(false)
  const mapCenter = ref<[number, number]>(DEFAULT_CENTER)
  const mapZoom = ref(DEFAULT_ZOOM)
  const currentBounds = ref<BoundingBox | null>(null)
  const selectedVenueId = ref<string | null>(null)
  const selectedVenue = ref<Venue | null>(null)
  const showVenueDetail = ref(false)

  return {
    initialized,
    mapCenter,
    mapZoom,
    currentBounds,
    selectedVenueId,
    selectedVenue,
    showVenueDetail
  }
})
