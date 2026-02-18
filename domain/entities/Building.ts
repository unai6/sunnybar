import type { Coordinates } from '../value-objects/Coordinates'

/**
 * Building Entity
 * Represents a building that may cast shadows
 */
export interface BuildingProps {
  id: string;
  coordinates: Coordinates;
  height?: number;           // Height in meters (if known)
  levels?: number;           // Number of floors (used to estimate height)
  footprint?: Coordinates[]; // Building polygon points
}

export class Building {
  private static readonly DEFAULT_FLOOR_HEIGHT = 3 // meters per floor
  private static readonly DEFAULT_HEIGHT = 10      // meters if nothing known

  private constructor(
    public readonly id: string,
    public readonly coordinates: Coordinates,
    public readonly height: number,
    public readonly footprint?: Coordinates[]
  ) {}

  static create(props: BuildingProps): Building {
    let height = props.height

    // Estimate height from levels if not provided
    if (!height && props.levels) {
      height = props.levels * Building.DEFAULT_FLOOR_HEIGHT
    }

    // Use default height if nothing available
    if (!height) {
      height = Building.DEFAULT_HEIGHT
    }

    return new Building(
      props.id,
      props.coordinates,
      height,
      props.footprint
    )
  }

  /**
   * Calculate shadow length at given sun altitude
   * @param sunAltitudeRadians - Sun altitude in radians
   * @returns Shadow length in meters
   */
  calculateShadowLength(sunAltitudeRadians: number): number {
    if (sunAltitudeRadians <= 0) {
      return Infinity
    }
    return this.height / Math.tan(sunAltitudeRadians)
  }

  /**
   * Check if this building could potentially shade a given point
   * @param point - The point to check
   * @param sunAzimuthDegrees - Sun azimuth in degrees (0=N, 90=E, 180=S, 270=W)
   * @param sunAltitudeRadians - Sun altitude in radians
   * @returns true if the building might cast shadow on the point
   */
  couldShadePoint(
    point: Coordinates,
    sunAzimuthDegrees: number,
    sunAltitudeRadians: number
  ): boolean {
    const shadowLength = this.calculateShadowLength(sunAltitudeRadians)
    if (shadowLength === Infinity) return true

    const distance = this.coordinates.distanceTo(point)

    // Quick check: if point is too far, building can't shade it
    if (distance > shadowLength + 50) { // 50m buffer
      return false
    }

    // Calculate direction from building to point
    const dLat = point.latitude - this.coordinates.latitude
    const dLng = point.longitude - this.coordinates.longitude
    const angleToPoint = (Math.atan2(dLng, dLat) * 180) / Math.PI

    // Shadow direction is opposite to sun
    let shadowDirection = sunAzimuthDegrees + 180
    if (shadowDirection >= 360) shadowDirection -= 360

    // Check if point is roughly in shadow direction (within 45 degrees)
    let angleDiff = Math.abs(angleToPoint - shadowDirection)
    if (angleDiff > 180) angleDiff = 360 - angleDiff

    return angleDiff < 45 && distance < shadowLength
  }
}
