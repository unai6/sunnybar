import SunCalc from 'suncalc'

export interface SunPosition {
  azimuthDegrees: number
  altitudeDegrees: number
  azimuthRadians: number
  altitudeRadians: number
}

/**
 * Calculate sun position for given location and time
 */
export function calculateSunPosition(
  latitude: number,
  longitude: number,
  date: Date
): SunPosition {
  const position = SunCalc.getPosition(date, latitude, longitude)

  // Convert azimuth from radians to degrees
  // SunCalc returns azimuth as radians from south, clockwise
  // We want degrees from north, clockwise (0=N, 90=E, 180=S, 270=W)
  let azimuthDegrees = (position.azimuth * 180) / Math.PI + 180
  if (azimuthDegrees >= 360) azimuthDegrees -= 360

  const altitudeDegrees = (position.altitude * 180) / Math.PI

  return {
    azimuthDegrees,
    altitudeDegrees,
    azimuthRadians: position.azimuth,
    altitudeRadians: position.altitude
  }
}

/**
 * Check if it's daytime (sun above horizon)
 */
export function isDaytime(altitude: number): boolean {
  return altitude > 0
}
