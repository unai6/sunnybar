import { SunlightStatus } from '~/shared/enums'
import type { SunlightStatusInfo } from '~/shared/types'

/**
 * useSunlightStatus Composable
 * Provides utilities for working with sunlight status
 */
export function useSunlightStatus() {
  /**
   * Create a sunlight status with clamped confidence
   */
  function create(
    status: SunlightStatus,
    confidence: number,
    reason?: string
  ): SunlightStatusInfo {
    const clampedConfidence = Math.max(0, Math.min(1, confidence))
    return { status, confidence: clampedConfidence, reason }
  }

  /**
   * Create a sunny status
   */
  function createSunny(
    confidence: number = 1,
    reason?: string
  ): SunlightStatusInfo {
    return create(SunlightStatus.SUNNY, confidence, reason)
  }

  /**
   * Create a shaded status
   */
  function createShaded(
    confidence: number = 1,
    reason?: string
  ): SunlightStatusInfo {
    return create(SunlightStatus.SHADED, confidence, reason)
  }

  /**
   * Create a partially sunny status
   */
  function createPartiallySunny(
    confidence: number = 0.5,
    reason?: string
  ): SunlightStatusInfo {
    return create(SunlightStatus.PARTIALLY_SUNNY, confidence, reason)
  }

  /**
   * Create a night status
   */
  function createNight(): SunlightStatusInfo {
    return create(SunlightStatus.NIGHT, 1, 'Sun is below the horizon')
  }

  /**
   * Create an unknown status
   */
  function createUnknown(reason?: string): SunlightStatusInfo {
    return create(
      SunlightStatus.UNKNOWN,
      0,
      reason || 'Unable to determine sunlight status'
    )
  }

  /**
   * Check if status is sunny or partially sunny
   */
  function isSunny(status: SunlightStatusInfo): boolean {
    return (
      status.status === SunlightStatus.SUNNY ||
      status.status === SunlightStatus.PARTIALLY_SUNNY
    )
  }

  /**
   * Check if status is shaded
   */
  function isShaded(status: SunlightStatusInfo): boolean {
    return status.status === SunlightStatus.SHADED
  }

  /**
   * Check if it's nighttime
   */
  function isNight(status: SunlightStatusInfo): boolean {
    return status.status === SunlightStatus.NIGHT
  }

  return {
    create,
    createSunny,
    createShaded,
    createPartiallySunny,
    createNight,
    createUnknown,
    isSunny,
    isShaded,
    isNight
  }
}
