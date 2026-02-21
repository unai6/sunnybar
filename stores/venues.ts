import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useVenue } from '~/composables/useVenue'
import type { BoundingBox, Venue, VenueFilters } from '~/shared/types'

/**
 * Venues Store
 * Holds shared state for venues across the app
 * Business logic is handled in the useVenues composable
 */
export const useVenuesStore = defineStore('venues', () => {
  const venue = useVenue()

  const venues = ref<Venue[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastBbox = ref<BoundingBox | null>(null)
  const filters = ref<VenueFilters>({
    onlySunny: false,
    onlyWithOutdoorSeating: false
  })

  // Computed values for convenience
  const sunnyVenues = computed(() =>
    venues.value.filter((v) => venue.isSunny(v))
  )
  const shadedVenues = computed(() =>
    venues.value.filter((v) => !venue.isSunny(v))
  )
  const filteredVenues = computed(() => {
    let result = venues.value

    if (filters.value.onlySunny) {
      result = result.filter((v) => venue.isSunny(v))
    }

    if (filters.value.onlyWithOutdoorSeating) {
      result = result.filter((v) => venue.hasOutdoorSeating(v))
    }

    return result
  })

  return {
    venues,
    loading,
    error,
    lastBbox,
    filters,
    sunnyVenues,
    shadedVenues,
    filteredVenues
  }
})
