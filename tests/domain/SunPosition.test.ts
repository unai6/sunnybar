import { describe, it, expect } from 'vitest'
import { SunPosition } from '../../domain/value-objects/SunPosition'

describe('SunPosition', () => {
  describe('create', () => {
    it('should create a sun position', () => {
      const now = new Date()
      const position = SunPosition.create({
        azimuth: Math.PI / 4,
        altitude: Math.PI / 6,
        timestamp: now
      })

      expect(position.azimuth).toBe(Math.PI / 4)
      expect(position.altitude).toBe(Math.PI / 6)
      expect(position.timestamp).toBe(now)
    })
  })

  describe('isAboveHorizon', () => {
    it('should return true for positive altitude', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: 0.5,
        timestamp: new Date()
      })

      expect(position.isAboveHorizon()).toBe(true)
    })

    it('should return false for negative altitude', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: -0.1,
        timestamp: new Date()
      })

      expect(position.isAboveHorizon()).toBe(false)
    })

    it('should return false for zero altitude', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: 0,
        timestamp: new Date()
      })

      expect(position.isAboveHorizon()).toBe(false)
    })
  })

  describe('getAltitudeDegrees', () => {
    it('should convert radians to degrees', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: Math.PI / 4, // 45 degrees
        timestamp: new Date()
      })

      expect(position.getAltitudeDegrees()).toBeCloseTo(45, 5)
    })
  })

  describe('getShadowLengthMultiplier', () => {
    it('should return correct multiplier for 45 degree altitude', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: Math.PI / 4, // 45 degrees
        timestamp: new Date()
      })

      // At 45 degrees, shadow length equals object height (multiplier = 1)
      expect(position.getShadowLengthMultiplier()).toBeCloseTo(1, 5)
    })

    it('should return Infinity for sun below horizon', () => {
      const position = SunPosition.create({
        azimuth: 0,
        altitude: -0.1,
        timestamp: new Date()
      })

      expect(position.getShadowLengthMultiplier()).toBe(Infinity)
    })

    it('should return larger multiplier for lower sun angle', () => {
      const highSun = SunPosition.create({
        azimuth: 0,
        altitude: Math.PI / 3, // 60 degrees
        timestamp: new Date()
      })

      const lowSun = SunPosition.create({
        azimuth: 0,
        altitude: Math.PI / 6, // 30 degrees
        timestamp: new Date()
      })

      expect(lowSun.getShadowLengthMultiplier()).toBeGreaterThan(
        highSun.getShadowLengthMultiplier()
      )
    })
  })

  describe('getShadowDirectionDegrees', () => {
    it('should return opposite direction to sun azimuth', () => {
      // Sun in the south (180°), shadow should be north (0° or 360°)
      const position = SunPosition.create({
        azimuth: 0, // SunCalc uses 0 = south
        altitude: Math.PI / 4,
        timestamp: new Date()
      })

      const shadowDir = position.getShadowDirectionDegrees()
      // Since azimuth 0 = south (180°), shadow should be north (0° or 360°)
      expect(shadowDir).toBeCloseTo(0, 1)
    })
  })
})
