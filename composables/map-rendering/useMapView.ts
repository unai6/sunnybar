import { ref } from 'vue'

/**
 * useMapView Composable
 * Manages MapView initialization, lifecycle, and interactions
 */
export function useMapView() {
  const MIN_ZOOM = 100
  const MAX_ZOOM = 1
  const FLY_TO_DURATION_MS = 1000
  const BASEMAP = 'streets-navigation-vector'

  let view: __esri.MapView | null = null
  let venueGraphicsLayer: __esri.GraphicsLayer | null = null
  const isLoading = ref(true)

  let stationaryWatchHandle: __esri.WatchHandle | null = null

  async function initialize(
    container: HTMLDivElement,
    center: [number, number],
    zoom: number,
    modules: {
      MapView: typeof import('@arcgis/core/views/MapView').default;
      EsriMap: typeof import('@arcgis/core/Map').default;
      GraphicsLayer: typeof import('@arcgis/core/layers/GraphicsLayer').default;
      reactiveUtils: typeof import('@arcgis/core/core/reactiveUtils');
    },
    callbacks: {
      onBoundsChanged: (stationary: boolean) => void;
      onVenueClick: (venueId: string) => void;
    }
  ): Promise<void> {
    // Ensure loading state is set
    isLoading.value = true

    try {
      const { MapView, EsriMap, GraphicsLayer, reactiveUtils } = modules

      venueGraphicsLayer = new GraphicsLayer({ title: 'Venues' })

      const map = new EsriMap({
        basemap: BASEMAP,
        layers: [venueGraphicsLayer]
      })

      view = new MapView({
        container,
        map,
        center: [center[1], center[0]],
        zoom,
        constraints: { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM },
        popupEnabled: false
      })

      await view.when()

      // Watch for stationary state (map stopped moving)
      stationaryWatchHandle = reactiveUtils.watch(
        () => Boolean(view?.stationary),
        (stationary: boolean) => {
          if (stationary && view) {
            callbacks.onBoundsChanged(stationary)
          }
        }
      )

      // Handle click events
      view.on('click', async (event) => {
        const response = await view!.hitTest(event)
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic' &&
            result.graphic.layer === venueGraphicsLayer
        )

        if (graphicHit) {
          const venueId = graphicHit.graphic.attributes.id
          callbacks.onVenueClick(venueId)
        }
      })
    } catch (error) {
      console.error('Error initializing map view:', error)
      throw error
    } finally {
      // Always set loading to false, even if there's an error
      isLoading.value = false
    }
  }

  function flyTo(latitude: number, longitude: number, zoom?: number): void {
    if (view) {
      view.goTo(
        {
          center: [longitude, latitude],
          zoom: zoom || view.zoom
        },
        { duration: FLY_TO_DURATION_MS }
      )
    }
  }

  function goToCenter(center: [number, number], zoom: number): void {
    if (view) {
      view.goTo(
        {
          center: [center[1], center[0]],
          zoom
        },
        { duration: FLY_TO_DURATION_MS }
      )
    }
  }

  function closePopups(): void {
    if (view) {
      view.closePopup()
    }
  }

  function getView(): __esri.MapView | null {
    return view
  }

  function getVenueGraphicsLayer(): __esri.GraphicsLayer | null {
    return venueGraphicsLayer
  }

  function setCenter(center: [number, number]): void {
    if (view) {
      view.center = { longitude: center[1], latitude: center[0] }
    }
  }

  function setZoom(zoom: number): void {
    if (view) {
      view.zoom = zoom
    }
  }

  function cleanup(): void {
    if (stationaryWatchHandle) {
      stationaryWatchHandle.remove()
      stationaryWatchHandle = null
    }
    if (view) {
      view.destroy()
      view = null
    }
  }

  return {
    isLoading,
    initialize,
    flyTo,
    goToCenter,
    closePopups,
    getView,
    getVenueGraphicsLayer,
    setCenter,
    setZoom,
    cleanup
  }
}
