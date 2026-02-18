import { describe, it, expect } from 'vitest'
import { SunCalcAdapter } from '../../infrastructure/adapters/SunCalcAdapter'
import { Coordinates } from '../../domain/value-objects/Coordinates'

describe('SunCalcAdapter', () => {
  const adapter = new SunCalcAdapter()
  const madrid = Coordinates.create({ latitude: 40.4168, longitude: -3.7038 })

  describe('getPosition', () => {
    it('should return sun position for a location and time', () => {
      // Summer noon in Madrid - sun should be high
      const summerNoon = new Date('2024-06-21T12:00:00')
      const position = adapter.getPosition(madrid, summerNoon)

      expect(position.altitude).toBeGreaterThan(0)
      expect(position.isAboveHorizon()).toBe(true)
    })

    it('should return sun below horizon at midnight', () => {
      const midnight = new Date('2024-06-21T02:00:00')
      const position = adapter.getPosition(madrid, midnight)

      expect(position.altitude).toBeLessThan(0)
      expect(position.isAboveHorizon()).toBe(false)
    })
  })

  describe('getSunTimes', () => {
    it('should return sun times for a location', () => {
      const date = new Date('2024-06-21')
      const times = adapter.getSunTimes(madrid, date)

      expect(times.sunrise).toBeInstanceOf(Date)
      expect(times.sunset).toBeInstanceOf(Date)
      expect(times.solarNoon).toBeInstanceOf(Date)
      expect(times.goldenHour).toBeInstanceOf(Date)

      // Sunrise should be before sunset
      expect(times.sunrise.getTime()).toBeLessThan(times.sunset.getTime())
      // Solar noon should be between sunrise and sunset
      expect(times.solarNoon.getTime()).toBeGreaterThan(times.sunrise.getTime())
      expect(times.solarNoon.getTime()).toBeLessThan(times.sunset.getTime())
    })
  })

  describe('isDaytime', () => {
    it('should return true during daytime', () => {
      const noon = new Date('2024-06-21T12:00:00')
      expect(adapter.isDaytime(madrid, noon)).toBe(true)
    })

    it('should return false during nighttime', () => {
      const midnight = new Date('2024-06-21T02:00:00')
      expect(adapter.isDaytime(madrid, midnight)).toBe(false)
    })
  })
})
