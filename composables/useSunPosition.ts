import type { SunPosition } from '~/shared/types'

/**
 * useSunPosition Composable
 * Provides utilities for working with sun position data
 */
export function useSunPosition() {
  /**
   * Create a sun position
   */
  function create(
    azimuth: number,
    altitude: number,
    timestamp: Date
  ): SunPosition {
    return { azimuth, altitude, timestamp }
  }

  /**
   * Check if the sun is above the horizon
   */
  function isAboveHorizon(position: SunPosition): boolean {
    return position.altitude > 0
  }

  /**
   * Get azimuth in degrees (0-360, where 0 = North, 90 = East, 180 = South, 270 = West)
   */
  function getAzimuthDegrees(position: SunPosition): number {
    // SunCalc returns azimuth where 0 = south, so we need to convert
    let degrees = (position.azimuth * 180) / Math.PI + 180
    if (degrees >= 360) degrees -= 360
    return degrees
  }

  /**
   * Get altitude in degrees
   */
  function getAltitudeDegrees(position: SunPosition): number {
    return (position.altitude * 180) / Math.PI
  }

  /**
   * Calculate shadow length multiplier based on sun altitude
   * Returns how many times taller the shadow is compared to object height
   */
  function getShadowLengthMultiplier(position: SunPosition): number {
    if (position.altitude <= 0) return Infinity
    return 1 / Math.tan(position.altitude)
  }

  /**
   * Get shadow direction (opposite to sun azimuth)
   */
  function getShadowDirectionDegrees(position: SunPosition): number {
    let shadowDirection = getAzimuthDegrees(position) + 180
    if (shadowDirection >= 360) shadowDirection -= 360
    return shadowDirection
  }

  return {
    create,
    isAboveHorizon,
    getAzimuthDegrees,
    getAltitudeDegrees,
    getShadowLengthMultiplier,
    getShadowDirectionDegrees
  }
}
