import { describe, expect, it } from 'vitest'
import { useCoordinates } from '~/composables/useCoordinates'
import { useSunCalculator } from '~/composables/useSunCalculator'

const { create: createCoordinates } = useCoordinates()
const { getPosition, getSunTimes, isDaytime } = useSunCalculator()

describe('useSunCalculator', () => {
  describe('getPosition', () => {
    it('should calculate sun position for a given location and time', () => {
      const coords = createCoordinates(40.4168, -3.7038) // Madrid
      const date = new Date('2024-06-21T12:00:00Z') // Summer solstice, noon UTC

      const position = getPosition(coords, date)

      expect(position.azimuth).toBeDefined()
      expect(position.altitude).toBeDefined()
      expect(position.timestamp).toBe(date)
    })
  })

  describe('getSunTimes', () => {
    it('should return sunrise and sunset times', () => {
      const coords = createCoordinates(40.4168, -3.7038)
      const date = new Date('2024-06-21')

      const times = getSunTimes(coords, date)

      expect(times.sunrise).toBeInstanceOf(Date)
      expect(times.sunset).toBeInstanceOf(Date)
      expect(times.solarNoon).toBeInstanceOf(Date)
      expect(times.goldenHour).toBeInstanceOf(Date)
      expect(times.sunrise.getTime()).toBeLessThan(times.sunset.getTime())
    })
  })

  describe('isDaytime', () => {
    it('should return true during day', () => {
      const coords = createCoordinates(40.4168, -3.7038)
      const noonDate = new Date('2024-06-21T12:00:00Z')

      expect(isDaytime(coords, noonDate)).toBe(true)
    })

    it('should return false at night', () => {
      const coords = createCoordinates(40.4168, -3.7038)
      const midnightDate = new Date('2024-06-21T00:00:00Z')

      expect(isDaytime(coords, midnightDate)).toBe(false)
    })
  })
})
