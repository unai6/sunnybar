import { ref } from 'vue'

/**
 * useSceneView Composable
 * Manages SceneView (3D) initialization, lifecycle, and interactions
 */
export function useSceneView() {
  const FLY_TO_DURATION_MS = 1000
  const CAMERA_TILT = 65
  const CAMERA_HEADING = 0
  const CAMERA_ALTITUDE_MULTIPLIER = 0.5
  const ZOOM_SCALE_BASE = 591657527.591555
  const VENUE_SELECT_DISTANCE = 150 // Distance in meters for venue selection
  const WORLD_ELEVATION_URL =
    'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
  const OSM_BUILDINGS_PORTAL_ID = 'ca0470dbbddb4db28bad74ed39949e25'
  const BASEMAP = 'streets-navigation-vector'
  const QUALITY_PROFILE = 'high'

  let view: __esri.SceneView | null = null
  let venueGraphicsLayer: __esri.GraphicsLayer | null = null
  const isLoading = ref(true)

  let stationaryWatchHandle: __esri.WatchHandle | null = null

  function zoomToScale(z: number): number {
    return ZOOM_SCALE_BASE / Math.pow(2, z)
  }

  async function initialize(
    container: HTMLDivElement,
    center: [number, number],
    zoom: number,
    modules: {
      SceneView: typeof import('@arcgis/core/views/SceneView').default;
      EsriMap: typeof import('@arcgis/core/Map').default;
      GraphicsLayer: typeof import('@arcgis/core/layers/GraphicsLayer').default;
      Ground: typeof import('@arcgis/core/Ground').default;
      ElevationLayer: typeof import('@arcgis/core/layers/ElevationLayer').default;
      SceneLayer: typeof import('@arcgis/core/layers/SceneLayer').default;
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
      const {
        SceneView,
        EsriMap,
        GraphicsLayer,
        Ground,
        ElevationLayer,
        SceneLayer,
        reactiveUtils
      } = modules

      venueGraphicsLayer = new GraphicsLayer({
        title: 'Venues',
        elevationInfo: {
          mode: 'relative-to-scene',
          offset: 5 // Elevated above scene geometry (buildings) for visibility and clickability
        }
      })

      // Create elevation layer for 3D terrain
      const worldElevation = new ElevationLayer({
        url: WORLD_ELEVATION_URL
      })

      // Create 3D buildings layer - realistic buildings worldwide
      const buildingsLayer = new SceneLayer({
        portalItem: {
          id: OSM_BUILDINGS_PORTAL_ID
        },
        popupEnabled: false
      })

      const map = new EsriMap({
        basemap: BASEMAP,
        ground: new Ground({
          layers: [worldElevation]
        }),
        layers: [buildingsLayer, venueGraphicsLayer]
      })

      view = new SceneView({
        container,
        map,
        camera: {
          position: {
            longitude: center[1],
            latitude: center[0],
            z: zoomToScale(zoom) * CAMERA_ALTITUDE_MULTIPLIER
          },
          tilt: CAMERA_TILT,
          heading: CAMERA_HEADING
        },
        popupEnabled: false,
        environment: {
          lighting: {
            type: 'sun',
            directShadowsEnabled: true
          }
        },
        qualityProfile: QUALITY_PROFILE
      })

      await view.when()

      // Enable realistic 3D buildings from the basemap
      view.environment.atmosphereEnabled = true
      view.environment.starsEnabled = false

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
        console.log('3D click hitTest results:', response.results)
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic' &&
            result.graphic.layer === venueGraphicsLayer
        )

        console.log('3D graphicHit:', graphicHit)
        if (graphicHit) {
          const venueId = graphicHit.graphic.attributes.id
          console.log('3D venue clicked:', venueId)
          callbacks.onVenueClick(venueId)
        }
      })
    } catch (error) {
      console.error('Error initializing scene view:', error)
      throw error
    } finally {
      // Always set loading to false, even if there's an error
      isLoading.value = false
    }
  }

  function flyTo(latitude: number, longitude: number, zoom?: number): void {
    if (!view) return

    if (zoom) {
      // When zoom is provided (e.g., venue selection), use a fixed comfortable distance
      view.goTo(
        {
          target: [longitude, latitude],
          tilt: CAMERA_TILT,
          heading: CAMERA_HEADING,
          position: {
            longitude,
            latitude,
            z: VENUE_SELECT_DISTANCE
          }
        },
        { duration: FLY_TO_DURATION_MS }
      )
    } else {
      view.goTo(
        {
          target: [longitude, latitude],
          tilt: CAMERA_TILT
        },
        { duration: FLY_TO_DURATION_MS }
      )
    }
  }

  function closePopups(): void {
    // SceneView has popupEnabled: false, so no popups to close
    // This method exists for API compatibility with MapView
  }

  function getView(): __esri.SceneView | null {
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
      view.goTo({
        zoom: zoomToScale(zoom) * CAMERA_ALTITUDE_MULTIPLIER
      })
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

    if (venueGraphicsLayer) {
      venueGraphicsLayer.destroy()
      venueGraphicsLayer = null
    }
  }

  return {
    initialize,
    flyTo,
    closePopups,
    getView,
    getVenueGraphicsLayer,
    setCenter,
    setZoom,
    cleanup,
    isLoading
  }
}
