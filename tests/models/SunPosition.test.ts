import { describe, expect, it } from 'vitest'
import { useSunPosition } from '~/composables/useSunPosition'

const {
  create,
  getAltitudeDegrees,
  getAzimuthDegrees,
  getShadowDirectionDegrees,
  getShadowLengthMultiplier,
  isAboveHorizon
} = useSunPosition()

describe('SunPosition Model', () => {
  describe('create', () => {
    it('should create sun position', () => {
      const position = create(1.5, 0.5, new Date())
      expect(position.azimuth).toBe(1.5)
      expect(position.altitude).toBe(0.5)
    })
  })

  describe('isAboveHorizon', () => {
    it('should return true when altitude is positive', () => {
      const position = create(0, 0.5, new Date())
      expect(isAboveHorizon(position)).toBe(true)
    })

    it('should return false when altitude is negative', () => {
      const position = create(0, -0.5, new Date())
      expect(isAboveHorizon(position)).toBe(false)
    })

    it('should return false when altitude is exactly 0', () => {
      const position = create(0, 0, new Date())
      expect(isAboveHorizon(position)).toBe(false)
    })
  })

  describe('getAzimuthDegrees', () => {
    it('should convert azimuth to degrees', () => {
      const position = create(Math.PI, 0.5, new Date())
      const degrees = getAzimuthDegrees(position)
      // Math.PI radians (south in SunCalc) converts to 0 degrees (north after adjustment)
      expect(degrees).toBeCloseTo(0, 1)
    })
  })

  describe('getAltitudeDegrees', () => {
    it('should convert altitude to degrees', () => {
      const position = create(0, Math.PI / 4, new Date())
      expect(getAltitudeDegrees(position)).toBeCloseTo(45, 1)
    })

    it('should handle negative altitude', () => {
      const position = create(0, -Math.PI / 6, new Date())
      expect(getAltitudeDegrees(position)).toBeCloseTo(-30, 1)
    })
  })

  describe('getShadowLengthMultiplier', () => {
    it('should return Infinity when sun is below horizon', () => {
      const position = create(0, -0.1, new Date())
      expect(getShadowLengthMultiplier(position)).toBe(Infinity)
    })

    it('should calculate shadow multiplier for above horizon', () => {
      const position = create(0, Math.PI / 4, new Date())
      const multiplier = getShadowLengthMultiplier(position)
      expect(multiplier).toBeCloseTo(1, 1)
    })
  })

  describe('getShadowDirectionDegrees', () => {
    it('should return opposite direction to azimuth', () => {
      const position = create(Math.PI, 0.5, new Date())
      const shadowDir = getShadowDirectionDegrees(position)
      expect(shadowDir).toBeCloseTo(180, 1)
    })
  })
})
