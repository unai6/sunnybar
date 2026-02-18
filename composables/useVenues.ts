import { ref, computed } from 'vue'
import { Venue, VenueType } from '~/domain/entities/Venue'
import { Coordinates } from '~/domain/value-objects/Coordinates'
import { SunlightStatus } from '~/domain/value-objects/SunlightStatus'
import type { BoundingBox } from '~/domain/repositories/VenueRepository'

export interface VenueFilters {
  onlySunny: boolean;
  onlyWithOutdoorSeating: boolean;
}

interface ApiVenue {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  address?: string
  outdoor_seating?: boolean
  sunlightStatus?: 'sunny' | 'shaded' | 'partially_sunny'
}

interface ApiResponse {
  venues: ApiVenue[]
  sunPosition: {
    azimuth: number
    altitude: number
    isDaytime: boolean
  }
  meta: {
    timestamp: string
    buildingsAnalyzed: number
    venueCount: number
  }
}

/**
 * Convert API venue response to domain Venue entity
 * Stores i18n keys as reason — translated at the view layer via $t()
 */
function apiVenueToDomain(apiVenue: ApiVenue): Venue {
  const coordinates = Coordinates.create({
    latitude: apiVenue.latitude,
    longitude: apiVenue.longitude
  })

  let sunlightStatus: SunlightStatus | undefined
  if (apiVenue.sunlightStatus) {
    switch (apiVenue.sunlightStatus) {
      case 'sunny':
        sunlightStatus = SunlightStatus.sunny(1, 'sunlight.description.directSunlight')
        break
      case 'shaded':
        sunlightStatus = SunlightStatus.shaded(1, 'sunlight.description.inBuildingShadow')
        break
      case 'partially_sunny':
        sunlightStatus = SunlightStatus.partiallySunny(0.7, 'sunlight.description.partialShadow')
        break
    }
  }

  return Venue.create({
    id: apiVenue.id,
    name: apiVenue.name,
    type: (apiVenue.type as VenueType) || VenueType.BAR,
    coordinates,
    address: apiVenue.address,
    outdoor_seating: apiVenue.outdoor_seating,
    sunlightStatus
  })
}

const MAX_BBOX_DEGREES = 0.05

function isBboxTooLarge(bbox: BoundingBox): boolean {
  return (bbox.north - bbox.south) > MAX_BBOX_DEGREES || (bbox.east - bbox.west) > MAX_BBOX_DEGREES
}

export function useVenues() {
  const toast = useToast()
  const { t } = useI18n()

  // State
  const venues = ref<Venue[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastBbox = ref<BoundingBox | null>(null)

  // Filters
  const filters = ref<VenueFilters>({
    onlySunny: false,
    onlyWithOutdoorSeating: false
  })

  // Computed
  const sunnyVenues = computed(() =>
    venues.value.filter(v => v.isSunny())
  )

  const shadedVenues = computed(() =>
    venues.value.filter(v => !v.isSunny())
  )

  const filteredVenues = computed(() => {
    let result = venues.value

    if (filters.value.onlySunny) {
      result = result.filter(v => v.isSunny())
    }

    if (filters.value.onlyWithOutdoorSeating) {
      result = result.filter(v => v.hasOutdoorSeating())
    }

    return result
  })

  // Actions
  const fetchVenuesByBoundingBox = async (
    bbox: BoundingBox,
    datetime?: Date
  ): Promise<void> => {
    // Client-side bbox validation — fail fast before hitting the server
    if (isBboxTooLarge(bbox)) {
      toast.add({
        severity: 'warn',
        summary: t('toast.error.title'),
        detail: t('toast.error.bboxTooLarge'),
        life: 5000
      })
      return
    }

    loading.value = true
    error.value = null

    console.log('[useVenues] Fetching venues via BFF for bbox:', bbox)

    try {
      const params = new URLSearchParams({
        south: bbox.south.toString(),
        west: bbox.west.toString(),
        north: bbox.north.toString(),
        east: bbox.east.toString(),
        ...(datetime && { datetime: datetime.toISOString() })
      })

      const response = await $fetch<ApiResponse>(`/api/venues?${params}`)

      venues.value = response.venues.map(apiVenueToDomain)
      lastBbox.value = bbox

      console.log(`[useVenues] Received ${response.venues.length} venues, ${response.meta.buildingsAnalyzed} buildings analyzed`)
    } catch (e: unknown) {
      console.error('[useVenues] Error fetching venues:', e)

      const err = e as { statusCode?: number; data?: { statusMessage?: string } }
      const statusMessage = err.data?.statusMessage || ''

      // Pick the right toast message based on error type
      let detail = t('toast.error.fetchVenues')
      if (statusMessage.includes('Bounding box too large')) {
        detail = t('toast.error.bboxTooLarge')
      } else if (err.statusCode === 0 || (e instanceof TypeError && (e as TypeError).message === 'Failed to fetch')) {
        detail = t('toast.error.network')
      }

      toast.add({
        severity: 'error',
        summary: t('toast.error.title'),
        detail,
        life: 5000
      })

      error.value = detail
      venues.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchVenuesNearby = async (
    latitude: number,
    longitude: number,
    radiusMeters: number = 500,
    datetime?: Date
  ): Promise<void> => {
    // Convert radius to approximate bbox
    const latDelta = radiusMeters / 111320 // ~111km per degree latitude
    const lonDelta = radiusMeters / (111320 * Math.cos(latitude * Math.PI / 180))

    const bbox: BoundingBox = {
      south: latitude - latDelta,
      north: latitude + latDelta,
      west: longitude - lonDelta,
      east: longitude + lonDelta
    }

    await fetchVenuesByBoundingBox(bbox, datetime)
  }

  const refreshSunlightStatus = async (datetime?: Date): Promise<void> => {
    if (!lastBbox.value) return
    await fetchVenuesByBoundingBox(lastBbox.value, datetime)
  }

  const setFilters = (newFilters: Partial<VenueFilters>): void => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearVenues = (): void => {
    venues.value = []
    lastBbox.value = null
    error.value = null
  }

  return {
    // State
    venues,
    loading,
    error,
    lastBbox,
    filters,

    // Computed
    sunnyVenues,
    shadedVenues,
    filteredVenues,

    // Actions
    fetchVenuesByBoundingBox,
    fetchVenuesNearby,
    refreshSunlightStatus,
    setFilters,
    clearVenues
  }
}
