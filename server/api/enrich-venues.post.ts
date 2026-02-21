import {
  findVenuesNeedingEnrichment,
  updateVenueEnrichment
} from '~/server/utils/db/venues'
import { geocodeCoordinates, delay } from '~/server/utils/enrichment/geocoding'

/**
 * POST /api/enrich-venues
 *
 * Background job to enrich venues with additional data (e.g. geocoded address).
 *
 * Query params:
 * - limit: number of venues to process (default: 10)
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Number.parseInt((query.limit as string) || '10', 10)

  console.info(`[Enrichment] Starting enrichment for up to ${limit} venues`)

  // Find venues that need enrichment
  const venues = await findVenuesNeedingEnrichment(limit)

  if (venues.length === 0) {
    return {
      success: true,
      message: 'No venues need enrichment',
      processed: 0
    }
  }

  console.info(`[Enrichment] Found ${venues.length} venues to enrich`)

  let enriched = 0
  let failed = 0

  // Process each venue
  for (const venue of venues) {
    try {
      // Geocode address
      const address = await geocodeCoordinates(venue.latitude, venue.longitude)

      if (address) {
        // Update venue with enriched data
        await updateVenueEnrichment(venue.venueId, { address })
        enriched++
        console.info(`[Enrichment] Enriched venue: ${venue.name}`)
      } else {
        failed++
        console.warn(`[Enrichment] Failed to geocode: ${venue.name}`)
      }

      // Rate limit: respect Nominatim's 1 req/sec limit
      await delay(1100)
    } catch (error) {
      failed++
      console.error(`[Enrichment] Error enriching ${venue.name}:`, error)
    }
  }

  console.info(
    `[Enrichment] Completed: ${enriched} enriched, ${failed} failed`
  )

  return {
    success: true,
    processed: enriched,
    failed,
    total: venues.length
  }
})
