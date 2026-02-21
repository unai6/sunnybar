import SunCalc from 'suncalc'
import type { Coordinates, SunPosition } from '~/shared/types'
import { useSunPosition } from './useSunPosition'

/**
 * useSunCalculator Composable
 * Provides sun calculation utilities using the SunCalc library
 * This is a stateless composable that provides pure calculation functions
 */
export function useSunCalculator() {
  const sunPosition = useSunPosition()

  /**
   * Calculate sun position for a given location and time
   */
  function getPosition(coordinates: Coordinates, datetime: Date): SunPosition {
    const position = SunCalc.getPosition(
      datetime,
      coordinates.latitude,
      coordinates.longitude
    )

    return sunPosition.create(position.azimuth, position.altitude, datetime)
  }

  /**
   * Get sunrise, sunset, and other sun times for a location
   */
  function getSunTimes(coordinates: Coordinates, date: Date) {
    const times = SunCalc.getTimes(
      date,
      coordinates.latitude,
      coordinates.longitude
    )

    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      goldenHour: times.goldenHour
    }
  }

  /**
   * Check if it's currently daytime at a location
   */
  function isDaytime(coordinates: Coordinates, datetime: Date): boolean {
    const position = getPosition(coordinates, datetime)
    return sunPosition.isAboveHorizon(position)
  }

  return {
    getPosition,
    getSunTimes,
    isDaytime
  }
}
