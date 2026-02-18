import { describe, it, expect } from 'vitest'
import { ShadowAnalyzerAdapter } from '../../infrastructure/adapters/ShadowAnalyzerAdapter'
import { Venue, VenueType } from '../../domain/entities/Venue'
import { Building } from '../../domain/entities/Building'
import { Coordinates } from '../../domain/value-objects/Coordinates'
import { SunPosition } from '../../domain/value-objects/SunPosition'
import { SunlightStatusType } from '../../domain/value-objects/SunlightStatus'

describe('ShadowAnalyzerAdapter', () => {
  const analyzer = new ShadowAnalyzerAdapter()

  const createVenue = (lat: number, lng: number): Venue => {
    return Venue.create({
      id: 'test-venue',
      name: 'Test Bar',
      type: VenueType.BAR,
      coordinates: Coordinates.create({ latitude: lat, longitude: lng })
    })
  }

  const createBuilding = (lat: number, lng: number, height: number = 20): Building => {
    return Building.create({
      id: 'test-building',
      coordinates: Coordinates.create({ latitude: lat, longitude: lng }),
      height
    })
  }

  const createSunPosition = (altitudeRadians: number, azimuthRadians: number): SunPosition => {
    return SunPosition.create({
      altitude: altitudeRadians,
      azimuth: azimuthRadians,
      timestamp: new Date()
    })
  }

  describe('analyzeVenue', () => {
    it('should return night status when sun is below horizon', () => {
      const venue = createVenue(40.4168, -3.7038)
      const sunPosition = createSunPosition(-0.1, 0) // Below horizon

      const status = analyzer.analyzeVenue(venue, [], sunPosition)

      expect(status.status).toBe(SunlightStatusType.NIGHT)
    })

    it('should return sunny when no buildings nearby', () => {
      const venue = createVenue(40.4168, -3.7038)
      const sunPosition = createSunPosition(Math.PI / 4, 0) // 45 degrees up

      const status = analyzer.analyzeVenue(venue, [], sunPosition)

      expect(status.status).toBe(SunlightStatusType.SUNNY)
    })

    it('should return sunny when buildings are far away', () => {
      const venue = createVenue(40.4168, -3.7038)
      // Building 1km away
      const farBuilding = createBuilding(40.4268, -3.7038, 30)
      const sunPosition = createSunPosition(Math.PI / 4, 0)

      const status = analyzer.analyzeVenue(venue, [farBuilding], sunPosition)

      expect(status.status).toBe(SunlightStatusType.SUNNY)
    })
  })

  describe('analyzeVenues', () => {
    it('should analyze multiple venues', () => {
      const venues = [
        Venue.create({
          id: 'test-venue-1',
          name: 'Test Bar 1',
          type: VenueType.BAR,
          coordinates: Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })
        }),
        Venue.create({
          id: 'test-venue-2',
          name: 'Test Bar 2',
          type: VenueType.BAR,
          coordinates: Coordinates.create({ latitude: 40.4170, longitude: -3.7040 })
        })
      ]
      const sunPosition = createSunPosition(Math.PI / 4, 0)

      const results = analyzer.analyzeVenues(venues, [], sunPosition)

      expect(results.size).toBe(2)
      expect(results.has('test-venue-1')).toBe(true)
      expect(results.has('test-venue-2')).toBe(true)
    })
  })
})
