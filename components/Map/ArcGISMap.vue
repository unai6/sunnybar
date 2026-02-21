<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useMapBounds } from '~/composables/map-interaction/useMapBounds'
import { useArcGISModules } from '~/composables/map-rendering/useArcGISModules'
import { useMapView } from '~/composables/map-rendering/useMapView'
import { useVenue } from '~/composables/useVenue'
import { useVenueMarkers } from '~/composables/venue-visualization/useVenueMarkers'
import { useVenueSymbols } from '~/composables/venue-visualization/useVenueSymbols'
import type { Venue } from '~/shared/types'
import MapLegend from './MapLegend.vue'
import MapLoadingOverlay from './MapLoadingOverlay.vue'

interface Props {
  venues: Venue[]
  center: [number, number]
  zoom: number
  selectedDateTime: Date
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'bounds-changed': [bounds: { south: number; west: number; north: number; east: number }]
  'venue-click': [venue: Venue]
}>()

// Composables
const { isSunny } = useVenue()
const { loadModules } = useArcGISModules()
const mapView = useMapView()

// Refs
const mapContainer = ref<HTMLDivElement | null>(null)

// Map modules (loaded dynamically)
let arcGISModules: Awaited<ReturnType<typeof loadModules>> | null = null
let venueSymbols: ReturnType<typeof useVenueSymbols> | null = null
let venueMarkers: ReturnType<typeof useVenueMarkers> | null = null
let mapBounds: ReturnType<typeof useMapBounds> | null = null

// Expose methods for parent component
defineExpose({
  flyTo: (lat: number, lng: number, zoom?: number) => {
    mapView.flyTo(lat, lng, zoom)
  },
  closePopups: () => {
    mapView.closePopups()
  }
})

// Event handlers
function handleBoundsChanged(): void {
  if (mapBounds) {
    mapBounds.emitBounds(mapView.getView(), (bounds) => {
      emit('bounds-changed', bounds)
    })
  }
}

function handleVenueClick(venueId: string): void {
  const venue = props.venues.find(venueItem => venueItem.id === venueId)
  if (venue) {
    emit('venue-click', venue)
  }
}

// Initialize map
async function initializeMap(): Promise<void> {
  if (!mapContainer.value) return

  mapView.isLoading.value = true

  const { error } = await attempt(async () => {
    // Load ArcGIS modules
    arcGISModules = await loadModules()

    // Initialize composables that depend on ArcGIS modules
    venueSymbols = useVenueSymbols(arcGISModules.SimpleMarkerSymbol)
    venueMarkers = useVenueMarkers(
      arcGISModules.Graphic,
      arcGISModules.Point,
      venueSymbols.createSunnySymbol,
      venueSymbols.createShadedSymbol,
      isSunny
    )
    mapBounds = useMapBounds(arcGISModules.webMercatorToGeographic)

    // Initialize map view
    await mapView.initialize(
      mapContainer.value!,
      props.center,
      props.zoom,
      {
        MapView: arcGISModules.MapView,
        EsriMap: arcGISModules.EsriMap,
        GraphicsLayer: arcGISModules.GraphicsLayer,
        reactiveUtils: arcGISModules.reactiveUtils
      },
      {
        onBoundsChanged: handleBoundsChanged,
        onVenueClick: handleVenueClick
      }
    )

    // Emit initial bounds
    if (mapBounds) {
      mapBounds.emitBoundsImmediate(mapView.getView(), (bounds) => {
        emit('bounds-changed', bounds)
      })
    }

    // Update markers if venues already exist
    if (props.venues.length > 0 && venueMarkers) {
      venueMarkers.updateMarkers(mapView.getVenueGraphicsLayer(), props.venues)
    }
  })

  if (error) {
    console.error('Failed to initialize ArcGIS map:', error)
  }

  mapView.isLoading.value = false
}

// Lifecycle hooks
onMounted(() => initializeMap())

onUnmounted(() => {
  if (mapBounds) {
    mapBounds.cleanup()
  }
  mapView.cleanup()
})

// Watchers
watch(
  () => props.venues,
  () => {
    if (venueMarkers) {
      venueMarkers.updateMarkers(mapView.getVenueGraphicsLayer(), props.venues)
    }
  },
  { deep: true }
)

watch(
  () => props.center,
  (newCenter) => {
    mapView.goToCenter(newCenter, props.zoom)
  }
)
</script>

<template>
  <div class="w-full h-full min-h-[400px] relative">
    <div ref="mapContainer" class="w-full h-full" />

    <MapLegend />
    <MapLoadingOverlay :is-loading="mapView.isLoading.value" />
  </div>
</template>
