/**
 * useArcGISModules Composable
 * Handles dynamic loading of ArcGIS modules
 */
export function useArcGISModules() {
  let MapView: typeof import('@arcgis/core/views/MapView').default
  let SceneView: typeof import('@arcgis/core/views/SceneView').default
  let EsriMap: typeof import('@arcgis/core/Map').default
  let GraphicsLayer: typeof import('@arcgis/core/layers/GraphicsLayer').default
  let Graphic: typeof import('@arcgis/core/Graphic').default
  let Point: typeof import('@arcgis/core/geometry/Point').default
  let SimpleMarkerSymbol: typeof import('@arcgis/core/symbols/SimpleMarkerSymbol').default
  let webMercatorToGeographic: typeof import('@arcgis/core/geometry/support/webMercatorUtils').webMercatorToGeographic
  let reactiveUtils: typeof import('@arcgis/core/core/reactiveUtils')
  let ElevationLayer: typeof import('@arcgis/core/layers/ElevationLayer').default
  let Ground: typeof import('@arcgis/core/Ground').default
  let SceneLayer: typeof import('@arcgis/core/layers/SceneLayer').default

  async function loadModules() {
    await import('@arcgis/core/assets/esri/themes/light/main.css')

    const [
      MapViewModule,
      SceneViewModule,
      MapModule,
      GraphicsLayerModule,
      GraphicModule,
      PointModule,
      SimpleMarkerSymbolModule,
      webMercatorUtilsModule,
      reactiveUtilsModule,
      ElevationLayerModule,
      GroundModule,
      SceneLayerModule
    ] = await Promise.all([
      import('@arcgis/core/views/MapView'),
      import('@arcgis/core/views/SceneView'),
      import('@arcgis/core/Map'),
      import('@arcgis/core/layers/GraphicsLayer'),
      import('@arcgis/core/Graphic'),
      import('@arcgis/core/geometry/Point'),
      import('@arcgis/core/symbols/SimpleMarkerSymbol'),
      import('@arcgis/core/geometry/support/webMercatorUtils'),
      import('@arcgis/core/core/reactiveUtils'),
      import('@arcgis/core/layers/ElevationLayer'),
      import('@arcgis/core/Ground'),
      import('@arcgis/core/layers/SceneLayer')
    ])

    MapView = MapViewModule.default
    SceneView = SceneViewModule.default
    EsriMap = MapModule.default
    GraphicsLayer = GraphicsLayerModule.default
    Graphic = GraphicModule.default
    Point = PointModule.default
    SimpleMarkerSymbol = SimpleMarkerSymbolModule.default
    webMercatorToGeographic = webMercatorUtilsModule.webMercatorToGeographic
    reactiveUtils = reactiveUtilsModule
    ElevationLayer = ElevationLayerModule.default
    Ground = GroundModule.default
    SceneLayer = SceneLayerModule.default

    return {
      MapView,
      SceneView,
      EsriMap,
      GraphicsLayer,
      Graphic,
      Point,
      SimpleMarkerSymbol,
      webMercatorToGeographic,
      reactiveUtils,
      ElevationLayer,
      Ground,
      SceneLayer
    }
  }

  return {
    loadModules
  }
}
