import { describe, it, expect } from 'vitest'
import { Venue, VenueType } from '../../domain/entities/Venue'
import { Coordinates } from '../../domain/value-objects/Coordinates'
import { SunlightStatus } from '../../domain/value-objects/SunlightStatus'

describe('Venue', () => {
  const validCoordinates = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

  describe('create', () => {
    it('should create a venue with valid props', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates,
        address: 'Test Street 123',
        outdoor_seating: true
      })

      expect(venue.id).toBe('node/123')
      expect(venue.name).toBe('Test Bar')
      expect(venue.type).toBe(VenueType.BAR)
      expect(venue.coordinates).toBe(validCoordinates)
      expect(venue.address).toBe('Test Street 123')
      expect(venue.outdoor_seating).toBe(true)
    })

    it('should throw error for missing id', () => {
      expect(() => {
        Venue.create({
          id: '',
          name: 'Test Bar',
          type: VenueType.BAR,
          coordinates: validCoordinates
        })
      }).toThrow('Venue must have an id')
    })

    it('should throw error for missing name', () => {
      expect(() => {
        Venue.create({
          id: 'node/123',
          name: '',
          type: VenueType.BAR,
          coordinates: validCoordinates
        })
      }).toThrow('Venue must have a name')
    })
  })

  describe('withSunlightStatus', () => {
    it('should return new venue with sunlight status', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates
      })

      const sunnyStatus = SunlightStatus.sunny()
      const venueWithStatus = venue.withSunlightStatus(sunnyStatus)

      expect(venueWithStatus.sunlightStatus).toBe(sunnyStatus)
      expect(venueWithStatus.id).toBe(venue.id)
      expect(venueWithStatus.name).toBe(venue.name)
      // Original venue should not be modified
      expect(venue.sunlightStatus).toBeUndefined()
    })
  })

  describe('isSunny', () => {
    it('should return true when sunlight status is sunny', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates
      }).withSunlightStatus(SunlightStatus.sunny())

      expect(venue.isSunny()).toBe(true)
    })

    it('should return false when sunlight status is shaded', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates
      }).withSunlightStatus(SunlightStatus.shaded())

      expect(venue.isSunny()).toBe(false)
    })

    it('should return false when no sunlight status', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates
      })

      expect(venue.isSunny()).toBe(false)
    })
  })

  describe('hasOutdoorSeating', () => {
    it('should return true when outdoor_seating is true', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates,
        outdoor_seating: true
      })

      expect(venue.hasOutdoorSeating()).toBe(true)
    })

    it('should return false when outdoor_seating is false', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates,
        outdoor_seating: false
      })

      expect(venue.hasOutdoorSeating()).toBe(false)
    })

    it('should return false when outdoor_seating is undefined', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates
      })

      expect(venue.hasOutdoorSeating()).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should serialize venue to JSON', () => {
      const venue = Venue.create({
        id: 'node/123',
        name: 'Test Bar',
        type: VenueType.BAR,
        coordinates: validCoordinates,
        outdoor_seating: true
      }).withSunlightStatus(SunlightStatus.sunny(0.9, 'Clear'))

      const json = venue.toJSON()

      expect(json.id).toBe('node/123')
      expect(json.name).toBe('Test Bar')
      expect(json.type).toBe('bar')
      expect(json.coordinates).toEqual({ lat: 40.4168, lng: -3.7038 })
      expect(json.outdoor_seating).toBe(true)
      expect(json.sunlightStatus).toEqual({
        status: 'SUNNY',
        confidence: 0.9,
        reason: 'Clear'
      })
    })
  })
})
