import type { BoundingBox } from '~/shared/types'
import mongoose from 'mongoose'

// Note: VenueDocument type will be inferred from the model
type VenueDocument = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Get the Venue model
 */
function getVenueModel() {
  return mongoose.models.Venue || mongoose.model('Venue')
}

/**
 * Find venues within a bounding box
 * Uses geospatial query for efficient location-based search
 */
export async function findVenuesInBounds(
  bounds: BoundingBox,
  options: {
    maxAgeDays?: number
    onlySunny?: boolean
    onlyOutdoorSeating?: boolean
  } = {}
): Promise<VenueDocument[]> {
  const { maxAgeDays = 7, onlyOutdoorSeating } = options

  const query: Record<string, unknown> = {
    location: {
      $geoWithin: {
        $box: [
          [bounds.west, bounds.south], // Bottom-left corner
          [bounds.east, bounds.north] // Top-right corner
        ]
      }
    }
  }

  // Only return venues synced recently
  if (maxAgeDays) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)
    query.lastSyncedOverpass = { $gte: cutoffDate }
  }

  // Apply filters
  if (onlyOutdoorSeating) {
    query.outdoorSeating = true
  }

  try {
    const Venue = getVenueModel()
    const venues = await Venue.find(query)
      .sort({ searchScore: -1, name: 1 })
      .lean()
      .exec()

    return venues as VenueDocument[]
  } catch (error) {
    console.error('Error finding venues in bounds:', error)
    return []
  }
}

/**
 * Upsert venue from Overpass data
 * Creates or updates a venue based on OSM ID
 */
export async function upsertVenueFromOverpass(
  venueData: {
    osmId: string
    osmType: string
    name: string
    venueType: string
    latitude: number
    longitude: number
    outdoorSeating?: boolean
  }
): Promise<VenueDocument | null> {
  try {
    const Venue = getVenueModel()
    // Create unique venue ID from OSM ID and type
    const venueId = `${venueData.osmType}-${venueData.osmId}`

    const venue = await Venue.findOneAndUpdate(
      { venueId },
      {
        $set: {
          venueId,
          osmId: venueData.osmId,
          osmType: venueData.osmType,
          name: venueData.name,
          venueType: venueData.venueType,
          latitude: venueData.latitude,
          longitude: venueData.longitude,
          outdoorSeating: venueData.outdoorSeating || false,
          location: {
            type: 'Point',
            coordinates: [venueData.longitude, venueData.latitude]
          },
          lastSyncedOverpass: new Date()
        },
        // Don't overwrite enriched data if it exists
        $setOnInsert: {
          enriched: false,
          verified: false,
          searchScore: 0
        }
      },
      {
        upsert: true,
        new: true,
        lean: true
      }
    )

    return venue as VenueDocument
  } catch (error) {
    console.error('Error upserting venue:', error)
    return null
  }
}

/**
 * Bulk upsert venues from Overpass
 * More efficient than individual upserts
 */
export async function bulkUpsertVenuesFromOverpass(
  venues: Array<{
    osmId: string
    osmType: string
    name: string
    venueType: string
    latitude: number
    longitude: number
    outdoorSeating?: boolean
  }>
): Promise<number> {
  try {
    const Venue = getVenueModel()
    const operations = venues.map((venueData) => {
      const venueId = `${venueData.osmType}-${venueData.osmId}`

      return {
        updateOne: {
          filter: { venueId },
          update: {
            $set: {
              venueId,
              osmId: venueData.osmId,
              osmType: venueData.osmType,
              name: venueData.name,
              venueType: venueData.venueType,
              latitude: venueData.latitude,
              longitude: venueData.longitude,
              outdoorSeating: venueData.outdoorSeating || false,
              location: {
                type: 'Point',
                coordinates: [venueData.longitude, venueData.latitude]
              },
              lastSyncedOverpass: new Date()
            },
            $setOnInsert: {
              enriched: false,
              verified: false,
              searchScore: 0
            }
          },
          upsert: true
        }
      }
    })

    const result = await Venue.bulkWrite(operations)
    return result.upsertedCount + result.modifiedCount
  } catch (error) {
    console.error('Error bulk upserting venues:', error)
    return 0
  }
}

/**
 * Find venues that need enrichment
 * Returns venues that haven't been enriched or need re-enrichment
 */
export async function findVenuesNeedingEnrichment(
  limit = 100
): Promise<VenueDocument[]> {
  try {
    const Venue = getVenueModel()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // Re-enrich after 30 days

    const venues = await Venue.find({
      $or: [
        { enriched: false },
        { lastEnriched: { $lt: cutoffDate } },
        { lastEnriched: null }
      ]
    })
      .limit(limit)
      .lean()
      .exec()

    return venues as VenueDocument[]
  } catch (error) {
    console.error('Error finding venues needing enrichment:', error)
    return []
  }
}

/**
 * Update venue with enriched data
 */
export async function updateVenueEnrichment(
  venueId: string,
  enrichmentData: {
    address?: {
      street?: string
      city?: string
      postalCode?: string
      country?: string
      formatted?: string
    }
    photos?: Array<{ url: string; source: string; attribution?: string }>
    hours?: unknown
    rating?: number
  }
): Promise<VenueDocument | null> {
  try {
    const Venue = getVenueModel()
    const venue = await Venue.findOneAndUpdate(
      { venueId },
      {
        $set: {
          ...enrichmentData,
          enriched: true,
          lastEnriched: new Date()
        }
      },
      { new: true, lean: true }
    )

    return venue as VenueDocument
  } catch (error) {
    console.error('Error updating venue enrichment:', error)
    return null
  }
}

/**
 * Check if bounds have cached data
 * Returns true if we have recent data for this area
 */
export async function hasCachedData(
  bounds: BoundingBox,
  maxAgeDays = 7
): Promise<boolean> {
  try {
    const Venue = getVenueModel()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)

    const count = await Venue.countDocuments({
      location: {
        $geoWithin: {
          $box: [
            [bounds.west, bounds.south],
            [bounds.east, bounds.north]
          ]
        }
      },
      lastSyncedOverpass: { $gte: cutoffDate }
    })

    return count > 0
  } catch (error) {
    console.error('Error checking cached data:', error)
    return false
  }
}
