import { describe, it, expect } from 'vitest'
import { Coordinates } from '../../domain/value-objects/Coordinates'

describe('Coordinates', () => {
  describe('create', () => {
    it('should create valid coordinates', () => {
      const coords = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

      expect(coords.latitude).toBe(40.4168)
      expect(coords.longitude).toBe(-3.7038)
    })

    it('should throw error for invalid latitude (too high)', () => {
      expect(() => {
        Coordinates.create({ latitude: 91, longitude: 0 })
      }).toThrow('Latitude must be between -90 and 90')
    })

    it('should throw error for invalid latitude (too low)', () => {
      expect(() => {
        Coordinates.create({ latitude: -91, longitude: 0 })
      }).toThrow('Latitude must be between -90 and 90')
    })

    it('should throw error for invalid longitude (too high)', () => {
      expect(() => {
        Coordinates.create({ latitude: 0, longitude: 181 })
      }).toThrow('Longitude must be between -180 and 180')
    })

    it('should throw error for invalid longitude (too low)', () => {
      expect(() => {
        Coordinates.create({ latitude: 0, longitude: -181 })
      }).toThrow('Longitude must be between -180 and 180')
    })
  })

  describe('toArray', () => {
    it('should return [latitude, longitude] array', () => {
      const coords = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

      expect(coords.toArray()).toEqual([40.4168, -3.7038])
    })
  })

  describe('toLatLng', () => {
    it('should return {lat, lng} object', () => {
      const coords = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

      expect(coords.toLatLng()).toEqual({ lat: 40.4168, lng: -3.7038 })
    })
  })

  describe('equals', () => {
    it('should return true for equal coordinates', () => {
      const coords1 = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })
      const coords2 = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

      expect(coords1.equals(coords2)).toBe(true)
    })

    it('should return false for different coordinates', () => {
      const coords1 = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })
      const coords2 = Coordinates.create({ latitude: 41.0, longitude: -3.7038 })

      expect(coords1.equals(coords2)).toBe(false)
    })
  })

  describe('distanceTo', () => {
    it('should calculate distance between two points', () => {
      // Madrid to Barcelona (approximately 500km)
      const madrid = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })
      const barcelona = Coordinates.create({ latitude: 41.3851, longitude: 2.1734 })

      const distance = madrid.distanceTo(barcelona)

      // Should be approximately 500km (500000m)
      expect(distance).toBeGreaterThan(490000)
      expect(distance).toBeLessThan(510000)
    })

    it('should return 0 for same point', () => {
      const coords = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

      expect(coords.distanceTo(coords)).toBe(0)
    })
  })
})
