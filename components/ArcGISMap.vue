<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Venue } from '~/domain/entities/Venue'

const { t } = useI18n()

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

// Refs
const mapContainer = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)

// ArcGIS objects (loaded dynamically)
let view: __esri.MapView | null = null
let venueGraphicsLayer: __esri.GraphicsLayer | null = null

// Module references
let MapView: typeof import('@arcgis/core/views/MapView').default
let EsriMap: typeof import('@arcgis/core/Map').default
let GraphicsLayer: typeof import('@arcgis/core/layers/GraphicsLayer').default
let Graphic: typeof import('@arcgis/core/Graphic').default
let Point: typeof import('@arcgis/core/geometry/Point').default
let SimpleMarkerSymbol: typeof import('@arcgis/core/symbols/SimpleMarkerSymbol').default
let webMercatorToGeographic: typeof import('@arcgis/core/geometry/support/webMercatorUtils').webMercatorToGeographic

// Expose methods
defineExpose({
  flyTo: (lat: number, lng: number, zoom?: number) => {
    if (view) {
      view.goTo({
        center: [lng, lat],
        zoom: zoom || view.zoom
      }, { duration: 1000 })
    }
  },
  closePopups: () => {
    if (view) {
      view.closePopup()
    }
  }
})

const emitBounds = (): void => {
  if (!view || !webMercatorToGeographic) return
  const extent = view.extent
  if (extent) {
    const geoExtent = webMercatorToGeographic(extent) as __esri.Extent
    emit('bounds-changed', {
      south: geoExtent.ymin,
      west: geoExtent.xmin,
      north: geoExtent.ymax,
      east: geoExtent.xmax
    })
  }
}

const loadArcGISModules = async () => {
  await import('@arcgis/core/assets/esri/themes/light/main.css')

  const [
    MapViewModule,
    MapModule,
    GraphicsLayerModule,
    GraphicModule,
    PointModule,
    SimpleMarkerSymbolModule,
    webMercatorUtilsModule
  ] = await Promise.all([
    import('@arcgis/core/views/MapView'),
    import('@arcgis/core/Map'),
    import('@arcgis/core/layers/GraphicsLayer'),
    import('@arcgis/core/Graphic'),
    import('@arcgis/core/geometry/Point'),
    import('@arcgis/core/symbols/SimpleMarkerSymbol'),
    import('@arcgis/core/geometry/support/webMercatorUtils')
  ])

  MapView = MapViewModule.default
  EsriMap = MapModule.default
  GraphicsLayer = GraphicsLayerModule.default
  Graphic = GraphicModule.default
  Point = PointModule.default
  SimpleMarkerSymbol = SimpleMarkerSymbolModule.default
  webMercatorToGeographic = webMercatorUtilsModule.webMercatorToGeographic
}

const createSunnySymbol = (): __esri.SimpleMarkerSymbol | null => {
  if (!SimpleMarkerSymbol) return null
  return new SimpleMarkerSymbol({
    size: 16,
    color: [255, 193, 7, 1],
    outline: { color: [255, 255, 255, 1], width: 2.5 }
  })
}

const createShadedSymbol = (): __esri.SimpleMarkerSymbol | null => {
  if (!SimpleMarkerSymbol) return null
  return new SimpleMarkerSymbol({
    size: 12,
    color: [107, 114, 128, 0.85],
    outline: { color: [255, 255, 255, 1], width: 2 }
  })
}

const updateVenueMarkers = (): void => {
  if (!venueGraphicsLayer || !Graphic || !Point) return

  venueGraphicsLayer.removeAll()

  props.venues.forEach(venue => {
    const point = new Point({
      longitude: venue.coordinates.longitude,
      latitude: venue.coordinates.latitude
    })

    const isSunny = venue.isSunny()
    const symbol = isSunny ? createSunnySymbol() : createShadedSymbol()
    if (!symbol) return

    const graphic = new Graphic({
      geometry: point,
      symbol,
      attributes: {
        id: venue.id,
        name: venue.name,
        type: venue.type,
        isSunny,
        address: venue.address,
        outdoor_seating: venue.outdoor_seating
      }
    })

    venueGraphicsLayer!.add(graphic)
  })
}

const initializeMap = async (): Promise<void> => {
  if (!mapContainer.value) return

  isLoading.value = true

  try {
    await loadArcGISModules()

    venueGraphicsLayer = new GraphicsLayer({ title: 'Venues' })

    const map = new EsriMap({
      basemap: 'streets-navigation-vector',
      layers: [venueGraphicsLayer]
    })

    view = new MapView({
      container: mapContainer.value,
      map,
      center: [props.center[1], props.center[0]],
      zoom: props.zoom,
      constraints: { minZoom: 10, maxZoom: 20 },
      popupEnabled: false
    })

    await view.when()

    view.watch('stationary', (stationary: boolean) => {
      if (stationary) emitBounds()
    })

    view.on('click', async (event) => {
      const response = await view!.hitTest(event)
      const graphicHit = response.results.find(
        (result): result is __esri.GraphicHit =>
          result.type === 'graphic' && result.graphic.layer === venueGraphicsLayer
      )

      if (graphicHit) {
        const venueId = graphicHit.graphic.attributes.id
        const venue = props.venues.find(v => v.id === venueId)
        if (venue) emit('venue-click', venue)
      }
    })

    emitBounds()
    if (props.venues.length > 0) updateVenueMarkers()

    isLoading.value = false
  } catch (error) {
    console.error('Failed to initialize ArcGIS map:', error)
    isLoading.value = false
  }
}

onMounted(() => initializeMap())

onUnmounted(() => {
  if (view) {
    view.destroy()
    view = null
  }
})

watch(() => props.venues, () => updateVenueMarkers(), { deep: true })

watch(() => props.center, (newCenter) => {
  if (view) {
    view.goTo({ center: [newCenter[1], newCenter[0]], zoom: props.zoom }, { duration: 1000 })
  }
})
</script>

<template>
  <div class="w-full h-full min-h-[400px] relative">
    <div ref="mapContainer" class="w-full h-full" />

    <!-- Map Legend -->
    <div class="absolute bottom-6 left-3 z-[100] bg-white rounded-xl px-4 py-3.5 shadow-lg text-sm">
      <div class="font-bold text-slate-800 mb-3 text-sm">☀️ {{ $t('map.title.legend') }}</div>
      <div class="flex items-center gap-2.5 mb-2">
        <span class="w-4 h-4 rounded-full bg-amber-400 border-[2.5px] border-white shadow-[0_0_0_1px_#d97706,0_2px_6px_rgba(255,193,7,0.4)]" />
        <span class="text-gray-700 font-medium">{{ $t('map.label.sunny') }}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-[0_0_0_1px_#4b5563]" />
        <span class="text-gray-700 font-medium">{{ $t('map.label.shaded') }}</span>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-4 z-[200] font-medium text-slate-600">
      <div class="w-10 h-10 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
      <span>{{ $t('map.message.loadingMap') }}</span>
    </div>
  </div>
</template>

<style>
/* Global ArcGIS widget overrides */
.esri-ui-corner .esri-component {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
}

.esri-attribution {
  font-size: 10px !important;
}
</style>
