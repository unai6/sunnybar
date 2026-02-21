import { describe, expect, it } from 'vitest'
import { useSunlightStatus } from '~/composables/useSunlightStatus'
import { SunlightStatus } from '~/shared/enums'

const {
  create,
  createNight,
  createPartiallySunny,
  createShaded,
  createSunny,
  createUnknown,
  isNight,
  isShaded,
  isSunny
} = useSunlightStatus()

describe('SunlightStatus Model', () => {
  describe('create', () => {
    it('should create sunlight status', () => {
      const status = create(SunlightStatus.SUNNY, 0.8)
      expect(status.status).toBe(SunlightStatus.SUNNY)
      expect(status.confidence).toBe(0.8)
    })

    it('should clamp confidence between 0 and 1', () => {
      const tooHigh = create(SunlightStatus.SUNNY, 1.5)
      const tooLow = create(SunlightStatus.SUNNY, -0.5)

      expect(tooHigh.confidence).toBe(1)
      expect(tooLow.confidence).toBe(0)
    })
  })

  describe('createSunny', () => {
    it('should create sunny status with full confidence by default', () => {
      const status = createSunny()
      expect(status.status).toBe(SunlightStatus.SUNNY)
      expect(status.confidence).toBe(1)
    })

    it('should accept custom confidence', () => {
      const status = createSunny(0.7, 'partial sun')
      expect(status.confidence).toBe(0.7)
      expect(status.reason).toBe('partial sun')
    })
  })

  describe('createShaded', () => {
    it('should create shaded status', () => {
      const status = createShaded(1, 'building shadow')
      expect(status.status).toBe(SunlightStatus.SHADED)
      expect(status.reason).toBe('building shadow')
    })
  })

  describe('createPartiallySunny', () => {
    it('should create partially sunny status with 0.5 confidence by default', () => {
      const status = createPartiallySunny()
      expect(status.status).toBe(SunlightStatus.PARTIALLY_SUNNY)
      expect(status.confidence).toBe(0.5)
    })
  })

  describe('createNight', () => {
    it('should create night status with full confidence', () => {
      const status = createNight()
      expect(status.status).toBe(SunlightStatus.NIGHT)
      expect(status.confidence).toBe(1)
      expect(status.reason).toBe('Sun is below the horizon')
    })
  })

  describe('createUnknown', () => {
    it('should create unknown status with 0 confidence', () => {
      const status = createUnknown()
      expect(status.status).toBe(SunlightStatus.UNKNOWN)
      expect(status.confidence).toBe(0)
    })
  })

  describe('isSunny', () => {
    it('should return true for sunny status', () => {
      const status = createSunny()
      expect(isSunny(status)).toBe(true)
    })

    it('should return true for partially sunny status', () => {
      const status = createPartiallySunny()
      expect(isSunny(status)).toBe(true)
    })

    it('should return false for shaded status', () => {
      const status = createShaded()
      expect(isSunny(status)).toBe(false)
    })
  })

  describe('isShaded', () => {
    it('should return true for shaded status', () => {
      const status = createShaded()
      expect(isShaded(status)).toBe(true)
    })

    it('should return false for sunny status', () => {
      const status = createSunny()
      expect(isShaded(status)).toBe(false)
    })
  })

  describe('isNight', () => {
    it('should return true for night status', () => {
      const status = createNight()
      expect(isNight(status)).toBe(true)
    })

    it('should return false for sunny status', () => {
      const status = createSunny()
      expect(isNight(status)).toBe(false)
    })
  })
})
