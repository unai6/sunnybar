/**
 * useMapBounds Composable
 * Manages map bounds emission with debouncing
 */
export function useMapBounds(
  webMercatorToGeographic: typeof import('@arcgis/core/geometry/support/webMercatorUtils').webMercatorToGeographic
) {
  const BOUNDS_UPDATE_DEBOUNCE_MS = 500
  let boundsUpdateTimeout: NodeJS.Timeout | null = null

  function emitBounds(
    view: __esri.MapView | null,
    emit: (bounds: {
      south: number;
      west: number;
      north: number;
      east: number;
    }) => void
  ): void {
    if (!view || !webMercatorToGeographic) return

    // Clear any pending timeout
    if (boundsUpdateTimeout) {
      clearTimeout(boundsUpdateTimeout)
    }

    // Debounce bounds updates to prevent excessive API calls during pan/zoom
    boundsUpdateTimeout = setTimeout(() => {
      if (!view || !webMercatorToGeographic) return
      const extent = view.extent
      if (extent) {
        const geoExtent = webMercatorToGeographic(extent) as __esri.Extent
        emit({
          south: geoExtent.ymin,
          west: geoExtent.xmin,
          north: geoExtent.ymax,
          east: geoExtent.xmax
        })
      }
    }, BOUNDS_UPDATE_DEBOUNCE_MS)
  }

  function emitBoundsImmediate(
    view: __esri.MapView | null,
    emit: (bounds: {
      south: number;
      west: number;
      north: number;
      east: number;
    }) => void
  ): void {
    if (!view || !webMercatorToGeographic) return
    const extent = view.extent
    if (extent) {
      const geoExtent = webMercatorToGeographic(extent) as __esri.Extent
      emit({
        south: geoExtent.ymin,
        west: geoExtent.xmin,
        north: geoExtent.ymax,
        east: geoExtent.xmax
      })
    }
  }

  function cleanup(): void {
    if (boundsUpdateTimeout) {
      clearTimeout(boundsUpdateTimeout)
      boundsUpdateTimeout = null
    }
  }

  return {
    emitBounds,
    emitBoundsImmediate,
    cleanup
  }
}
