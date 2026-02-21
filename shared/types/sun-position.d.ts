/**
 * SunPosition Type
 * Represents the sun's position in the sky at a given time
 */
export interface SunPosition {
  azimuth: number; // in radians
  altitude: number; // in radians
  timestamp: Date;
}
