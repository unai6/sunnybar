import { describe, expect, it } from 'vitest'
import { useCoordinates } from '~/composables/useCoordinates'

const { create, toArray, toLatLng, areEqual, calculateDistance } =
  useCoordinates()

describe('Coordinates Model', () => {
  describe('create', () => {
    it('should create coordinates with valid lat/lng', () => {
      const coords = create(40.4168, -3.7038)
      expect(coords.latitude).toBe(40.4168)
      expect(coords.longitude).toBe(-3.7038)
    })

    it('should reject invalid latitude', () => {
      expect(() => create(91, 0)).toThrow(
        'Latitude must be between -90 and 90'
      )
      expect(() => create(-91, 0)).toThrow(
        'Latitude must be between -90 and 90'
      )
    })

    it('should reject invalid longitude', () => {
      expect(() => create(0, 181)).toThrow(
        'Longitude must be between -180 and 180'
      )
      expect(() => create(0, -181)).toThrow(
        'Longitude must be between -180 and 180'
      )
    })
  })

  describe('toArray', () => {
    it('should convert to [lat, lng] array', () => {
      const coords = create(40.4168, -3.7038)
      expect(toArray(coords)).toEqual([40.4168, -3.7038])
    })
  })

  describe('toLatLng', () => {
    it('should convert to {lat, lng} object', () => {
      const coords = create(40.4168, -3.7038)
      expect(toLatLng(coords)).toEqual({ lat: 40.4168, lng: -3.7038 })
    })
  })

  describe('areEqual', () => {
    it('should return true for equal coordinates', () => {
      const a = create(40.4168, -3.7038)
      const b = create(40.4168, -3.7038)
      expect(areEqual(a, b)).toBe(true)
    })

    it('should return false for different coordinates', () => {
      const a = create(40.4168, -3.7038)
      const b = create(41.3851, 2.1734)
      expect(areEqual(a, b)).toBe(false)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const madrid = create(40.4168, -3.7038)
      const barcelona = create(41.3851, 2.1734)
      const distance = calculateDistance(madrid, barcelona)

      // Madrid to Barcelona is approximately 504 km
      expect(distance).toBeGreaterThan(500000)
      expect(distance).toBeLessThan(510000)
    })

    it('should return 0 for same location', () => {
      const coords = create(40.4168, -3.7038)
      expect(calculateDistance(coords, coords)).toBe(0)
    })
  })
})
