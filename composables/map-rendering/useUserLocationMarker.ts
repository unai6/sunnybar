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
      color: [255, 0, 0.5],
      size: 24,
      outline: {
        color: [255, 255, 255],
        width: 2
      },
      // Classic location pin path (inverted teardrop)
      path: 'M12,2 C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zm0,9.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z',
      yoffset: 12 // Offset so pin point is at the location
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
