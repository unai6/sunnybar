/**
 * SunPosition Value Object
 * Represents the position of the sun at a given moment
 */
export interface SunPositionProps {
  azimuth: number;      // Angle in radians, direction along the horizon (0 = south, π/2 = west)
  altitude: number;     // Angle in radians above the horizon
  timestamp: Date;
}

export class SunPosition {
  private constructor(
    public readonly azimuth: number,
    public readonly altitude: number,
    public readonly timestamp: Date
  ) {}

  static create(props: SunPositionProps): SunPosition {
    return new SunPosition(props.azimuth, props.altitude, props.timestamp)
  }

  /**
   * Check if the sun is above the horizon
   */
  isAboveHorizon(): boolean {
    return this.altitude > 0
  }

  /**
   * Get azimuth in degrees (0-360, where 0 = North, 90 = East, 180 = South, 270 = West)
   */
  getAzimuthDegrees(): number {
    // SunCalc returns azimuth where 0 = south, so we need to convert
    let degrees = (this.azimuth * 180) / Math.PI + 180
    if (degrees >= 360) degrees -= 360
    return degrees
  }

  /**
   * Get altitude in degrees
   */
  getAltitudeDegrees(): number {
    return (this.altitude * 180) / Math.PI
  }

  /**
   * Calculate shadow length multiplier based on sun altitude
   * Returns how many times taller the shadow is compared to object height
   */
  getShadowLengthMultiplier(): number {
    if (this.altitude <= 0) return Infinity
    return 1 / Math.tan(this.altitude)
  }

  /**
   * Get shadow direction (opposite to sun azimuth)
   */
  getShadowDirectionDegrees(): number {
    let shadowDirection = this.getAzimuthDegrees() + 180
    if (shadowDirection >= 360) shadowDirection -= 360
    return shadowDirection
  }
}
