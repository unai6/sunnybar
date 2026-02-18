import type { Coordinates } from '../value-objects/Coordinates'
import type { SunPosition } from '../value-objects/SunPosition'

/**
 * SunCalculatorService Port
 * Defines the interface for calculating sun position
 */
export interface SunCalculatorService {
  /**
   * Calculate sun position for a given location and time
   * @param coordinates - Geographic location
   * @param datetime - Date and time for calculation
   */
  getPosition(coordinates: Coordinates, datetime: Date): SunPosition;

  /**
   * Get sunrise and sunset times for a location on a given date
   */
  getSunTimes(coordinates: Coordinates, date: Date): {
    sunrise: Date;
    sunset: Date;
    solarNoon: Date;
    goldenHour: Date;
  };

  /**
   * Check if it's currently daytime at a location
   */
  isDaytime(coordinates: Coordinates, datetime: Date): boolean;
}
