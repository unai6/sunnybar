/**
 * useUserLocationMarker Composable
 * Manages the user's location marker on the map
 */
export function useUserLocationMarker(
  Graphic: typeof import('@arcgis/core/Graphic').default,
  Point: typeof import('@arcgis/core/geometry/Point').default,
  SimpleMarkerSymbol: typeof import('@arcgis/core/symbols/SimpleMarkerSymbol').default
) {
  let userLocationGraphic: __esri.Graphic | null = null

  function createUserLocationSymbol(): __esri.SimpleMarkerSymbol {
    return new SimpleMarkerSymbol({
      color: [0, 122, 255],
      size: 16,
      outline: {
        color: [255, 255, 255],
        width: 2
      }
    })
  }

  function setUserLocation(
    graphicsLayer: __esri.GraphicsLayer | null,
    latitude: number,
    longitude: number
  ): void {
    if (!graphicsLayer || !Graphic || !Point) return

    // Remove existing user location marker if it exists
    if (userLocationGraphic) {
      graphicsLayer.remove(userLocationGraphic)
    }

    // Create point geometry
    const point = new Point({
      longitude,
      latitude
    })

    const symbol = createUserLocationSymbol()

    // Create new graphic for user location
    userLocationGraphic = new Graphic({
      geometry: point,
      symbol,
      attributes: {
        type: 'user-location'
      }
    })

    graphicsLayer.add(userLocationGraphic)
  }

  function clearUserLocation(graphicsLayer: __esri.GraphicsLayer | null): void {
    if (!graphicsLayer || !userLocationGraphic) return

    graphicsLayer.remove(userLocationGraphic)
    userLocationGraphic = null
  }

  return {
    setUserLocation,
    clearUserLocation
  }
}
