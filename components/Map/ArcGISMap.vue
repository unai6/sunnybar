<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMapBounds } from '~/composables/map-interaction/useMapBounds'
import { useArcGISModules } from '~/composables/map-rendering/useArcGISModules'
import { useMapView } from '~/composables/map-rendering/useMapView'
import { useSceneView } from '~/composables/map-rendering/useSceneView'
import { useVenue } from '~/composables/useVenue'
import { useVenueMarkers } from '~/composables/venue-visualization/useVenueMarkers'
import { useVenueSymbols } from '~/composables/venue-visualization/useVenueSymbols'
import type { Venue } from '~/shared/types'
import { useMapViewStore } from '~/stores/mapView'
import { attempt } from '~/utils/attempt'

type Props = {
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
const sceneView = useSceneView()
const mapViewStore = useMapViewStore()
const { viewMode } = storeToRefs(mapViewStore)

// Refs
const mapContainer = ref<HTMLDivElement | null>(null)
const currentView = computed(() => viewMode.value === '2d' ? mapView : sceneView)
const isLoading = computed(() => currentView.value.isLoading.value)

// Map modules (loaded dynamically)
let arcGISModules: Awaited<ReturnType<typeof loadModules>> | null = null
let venueSymbols: ReturnType<typeof useVenueSymbols> | null = null
let venueMarkers: ReturnType<typeof useVenueMarkers> | null = null
let mapBounds: ReturnType<typeof useMapBounds> | null = null

// Expose methods for parent component
defineExpose({
  flyTo: (lat: number, lng: number, zoom?: number) => {
    currentView.value.flyTo(lat, lng, zoom)
  },
  closePopups: () => {
    currentView.value.closePopups()
  }
})

// Event handlers
function handleBoundsChanged(): void {
  if (mapBounds) {
    mapBounds.emitBounds(currentView.value.getView(), (bounds) => {
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

    // Initialize the appropriate view based on mode
    await initializeView()
  })

  if (error) {
    console.error('Failed to initialize ArcGIS map:', error)
  }
}

async function initializeView(): Promise<void> {
  if (!mapContainer.value || !arcGISModules) return

  // Cleanup existing view
  currentView.value.cleanup()

  if (viewMode.value === '2d') {
    // Initialize 2D map view
    await mapView.initialize(
      mapContainer.value,
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
  } else {
    // Initialize 3D scene view
    await sceneView.initialize(
      mapContainer.value,
      props.center,
      props.zoom,
      {
        SceneView: arcGISModules.SceneView,
        EsriMap: arcGISModules.EsriMap,
        GraphicsLayer: arcGISModules.GraphicsLayer,
        Ground: arcGISModules.Ground,
        ElevationLayer: arcGISModules.ElevationLayer,
        SceneLayer: arcGISModules.SceneLayer,
        reactiveUtils: arcGISModules.reactiveUtils
      },
      {
        onBoundsChanged: handleBoundsChanged,
        onVenueClick: handleVenueClick
      }
    )
  }

  // Emit initial bounds
  if (mapBounds) {
    mapBounds.emitBoundsImmediate(currentView.value.getView(), (bounds) => {
      emit('bounds-changed', bounds)
    })
  }

  // Update markers if venues already exist
  if (props.venues.length > 0 && venueMarkers) {
    venueMarkers.updateMarkers(currentView.value.getVenueGraphicsLayer(), props.venues)
  }
}

// Lifecycle hooks
onMounted(() => initializeMap())

onUnmounted(() => {
  if (mapBounds) {
    mapBounds.cleanup()
  }
  mapView.cleanup()
  sceneView.cleanup()
})

// Watchers
watch(() => props.venues, (value) => {
  if (venueMarkers) {
      venueMarkers.updateMarkers(currentView.value.getVenueGraphicsLayer(), value)
    }
  },
  { deep: true }
)

watch(() => props.center, (newCenter) => {
    currentView.value.setCenter(newCenter)
  }
)

// Watch for view mode changes and reinitialize
watch(viewMode, async () => {
  if (arcGISModules) {
    await initializeView()
  }
})
</script>

<template>
  <div class="w-full h-full min-h-[400px] relative">
    <div ref="mapContainer" class="w-full h-full" />
    <MapViewToggle />
    <MapLegend />
    <MapLoadingOverlay :is-loading="isLoading" />
  </div>
</template>
