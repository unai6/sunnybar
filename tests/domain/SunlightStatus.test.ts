import { describe, it, expect } from 'vitest'
import { SunlightStatus, SunlightStatusType } from '../../domain/value-objects/SunlightStatus'

describe('SunlightStatus', () => {
  describe('factory methods', () => {
    it('should create sunny status', () => {
      const status = SunlightStatus.sunny(0.9, 'Clear sky')

      expect(status.status).toBe(SunlightStatusType.SUNNY)
      expect(status.confidence).toBe(0.9)
      expect(status.reason).toBe('Clear sky')
    })

    it('should create shaded status', () => {
      const status = SunlightStatus.shaded(0.8, 'Building shadow')

      expect(status.status).toBe(SunlightStatusType.SHADED)
      expect(status.confidence).toBe(0.8)
      expect(status.reason).toBe('Building shadow')
    })

    it('should create partially sunny status', () => {
      const status = SunlightStatus.partiallySunny(0.6)

      expect(status.status).toBe(SunlightStatusType.PARTIALLY_SUNNY)
      expect(status.confidence).toBe(0.6)
    })

    it('should create night status', () => {
      const status = SunlightStatus.night()

      expect(status.status).toBe(SunlightStatusType.NIGHT)
      expect(status.confidence).toBe(1)
      expect(status.reason).toBe('Sun is below the horizon')
    })

    it('should create unknown status', () => {
      const status = SunlightStatus.unknown('No data available')

      expect(status.status).toBe(SunlightStatusType.UNKNOWN)
      expect(status.confidence).toBe(0)
      expect(status.reason).toBe('No data available')
    })
  })

  describe('confidence clamping', () => {
    it('should clamp confidence to max 1', () => {
      const status = SunlightStatus.create({
        status: SunlightStatusType.SUNNY,
        confidence: 1.5
      })

      expect(status.confidence).toBe(1)
    })

    it('should clamp confidence to min 0', () => {
      const status = SunlightStatus.create({
        status: SunlightStatusType.SUNNY,
        confidence: -0.5
      })

      expect(status.confidence).toBe(0)
    })
  })

  describe('isSunny', () => {
    it('should return true for SUNNY status', () => {
      expect(SunlightStatus.sunny().isSunny()).toBe(true)
    })

    it('should return true for PARTIALLY_SUNNY status', () => {
      expect(SunlightStatus.partiallySunny().isSunny()).toBe(true)
    })

    it('should return false for SHADED status', () => {
      expect(SunlightStatus.shaded().isSunny()).toBe(false)
    })

    it('should return false for NIGHT status', () => {
      expect(SunlightStatus.night().isSunny()).toBe(false)
    })
  })

  describe('isShaded', () => {
    it('should return true for SHADED status', () => {
      expect(SunlightStatus.shaded().isShaded()).toBe(true)
    })

    it('should return false for SUNNY status', () => {
      expect(SunlightStatus.sunny().isShaded()).toBe(false)
    })
  })

  describe('isNight', () => {
    it('should return true for NIGHT status', () => {
      expect(SunlightStatus.night().isNight()).toBe(true)
    })

    it('should return false for SUNNY status', () => {
      expect(SunlightStatus.sunny().isNight()).toBe(false)
    })
  })
})
