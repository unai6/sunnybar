import { defineMongooseModel } from '#nuxt/mongoose'
import { Schema } from 'mongoose'

export const VenueSchema = defineMongooseModel({
  name: 'Venue',
  schema: new Schema(
    {
      // Unique identifier (hash of OSM ID + type)
      venueId: {
        type: String,
        required: true,
        unique: true,
        index: true
      },

      // Original Overpass/OSM data
      osmId: {
        type: String,
        required: true,
        index: true
      },
      osmType: {
        type: String,
        required: true,
        enum: ['node', 'way', 'relation']
      },

      // Core venue data
      name: {
        type: String,
        required: true,
        index: true
      },
      venueType: {
        type: String,
        required: true,
        index: true
      },

      // Geolocation (indexed for spatial queries)
      location: {
        type: {
          type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      },

      // Legacy coordinate fields for easy access
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      },

      // Venue features
      outdoorSeating: {
        type: Boolean,
        default: false
      },

      // Enriched data (from geocoding)
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
        formatted: String
      },

      // Additional enriched data
      photos: [
        {
          url: String,
          source: String, // 'mapbox', 'google', 'user'
          attribution: String
        }
      ],

      hours: {
        type: Schema.Types.Mixed, // Flexible JSON for opening hours
        default: null
      },

      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null
      },

      // Data quality flags
      verified: {
        type: Boolean,
        default: false
      },
      enriched: {
        type: Boolean,
        default: false
      },

      // Cache and sync metadata
      lastSyncedOverpass: {
        type: Date,
        default: null
      },
      lastEnriched: {
        type: Date,
        default: null
      },

      // Search optimization
      searchScore: {
        type: Number,
        default: 0,
        index: true
      }
    },
    {
      timestamps: true, // Adds createdAt and updatedAt
      collection: 'venues'
    }
  ),
  options: {},
  hooks: (schema) => {
    // Create geospatial index for location-based queries
    schema.index({ location: '2dsphere' })

    // Composite index for common queries
    schema.index({ venueType: 1, outdoorSeating: 1 })
    schema.index({ lastSyncedOverpass: 1 })

    // Pre-save hook to ensure location is set from lat/lng
    schema.pre('save', function (next) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = this as any
      if (doc.latitude && doc.longitude && !doc.location) {
        doc.location = {
          type: 'Point',
          coordinates: [doc.longitude, doc.latitude]
        }
      }
      next()
    })
  }
})

export type VenueDocument = InstanceType<typeof VenueSchema>
