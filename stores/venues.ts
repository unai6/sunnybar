import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Venue } from '~/domain/entities/Venue'
import type { BoundingBox } from '~/domain/repositories/VenueRepository'

export interface VenueFilters {
  onlySunny: boolean;
  onlyWithOutdoorSeating: boolean;
}

export const useVenuesStore = defineStore('venues', () => {
  // State
  const venues = ref<Venue[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastBbox = ref<BoundingBox | null>(null)
  const filters = ref<VenueFilters>({
    onlySunny: false,
    onlyWithOutdoorSeating: false
  })

  // Getters
  const sunnyVenues = computed(() => venues.value.filter((v) => v.isSunny()))

  const shadedVenues = computed(() => venues.value.filter((v) => !v.isSunny()))

  const filteredVenues = computed(() => {
    let result = venues.value

    if (filters.value.onlySunny) {
      result = result.filter((v) => v.isSunny())
    }

    if (filters.value.onlyWithOutdoorSeating) {
      result = result.filter((v) => v.hasOutdoorSeating())
    }

    return result
  })

  // Actions
  function setVenues(newVenues: Venue[]) {
    venues.value = newVenues
  }

  function setLoading(value: boolean) {
    loading.value = value
  }

  function setError(value: string | null) {
    error.value = value
  }

  function setLastBbox(bbox: BoundingBox | null) {
    lastBbox.value = bbox
  }

  function setFilters(newFilters: Partial<VenueFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  return {
    // State
    venues,
    loading,
    error,
    lastBbox,
    filters,

    // Getters
    sunnyVenues,
    shadedVenues,
    filteredVenues,

    // Actions
    setVenues,
    setLoading,
    setError,
    setLastBbox,
    setFilters
  }
})
