import type { Venue } from '~/shared/types'

/**
 * useVenueMarkers Composable
 * Manages venue markers on the map (create, update, remove)
 */
export function useVenueMarkers(
  Graphic: typeof import('@arcgis/core/Graphic').default,
  Point: typeof import('@arcgis/core/geometry/Point').default,
  createSunnySymbol: () => __esri.SimpleMarkerSymbol,
  createShadedSymbol: () => __esri.SimpleMarkerSymbol,
  isSunny: (venue: Venue) => boolean
) {
  function updateMarkers(
    venueGraphicsLayer: __esri.GraphicsLayer | null,
    venues: Venue[]
  ): void {
    if (!venueGraphicsLayer || !Graphic || !Point) return

    // Create a map of existing graphics by venue ID for efficient lookups
    const existingGraphics = new Map<string, __esri.Graphic>()
    venueGraphicsLayer.graphics.forEach((graphic) => {
      if (graphic.attributes?.id) {
        existingGraphics.set(graphic.attributes.id, graphic)
      }
    })

    const currentVenueIds = new Set<string>()
    const graphicsToAdd: __esri.Graphic[] = []

    // Update or create graphics for current venues
    venues.forEach((venue) => {
      currentVenueIds.add(venue.id)

      const venueIsSunny = isSunny(venue)
      const existingGraphic = existingGraphics.get(venue.id)

      // Check if graphic needs update
      if (
        existingGraphic &&
        existingGraphic.attributes.isSunny === venueIsSunny
      ) {
        // No change needed, keep existing graphic
        return
      }

      // Remove outdated graphic if it exists
      if (existingGraphic) {
        venueGraphicsLayer.remove(existingGraphic)
      }

      // Create new graphic
      const point = new Point({
        longitude: venue.coordinates.longitude,
        latitude: venue.coordinates.latitude
      })

      const symbol = venueIsSunny ? createSunnySymbol() : createShadedSymbol()

      const graphic = new Graphic({
        geometry: point,
        symbol,
        attributes: {
          id: venue.id,
          name: venue.name,
          type: venue.type,
          isSunny: venueIsSunny,
          address: venue.address,
          outdoor_seating: venue.outdoor_seating
        }
      })

      graphicsToAdd.push(graphic)
    })

    // Remove graphics for venues that no longer exist
    existingGraphics.forEach((graphic, venueId) => {
      if (!currentVenueIds.has(venueId)) {
        venueGraphicsLayer.remove(graphic)
      }
    })

    // Add all new graphics in a single batch for better performance
    if (graphicsToAdd.length > 0) {
      venueGraphicsLayer.addMany(graphicsToAdd)
    }
  }

  return {
    updateMarkers
  }
}
