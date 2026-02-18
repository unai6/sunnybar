import type { Venue } from '../entities/Venue'
import type { Building } from '../entities/Building'
import type { SunPosition } from '../value-objects/SunPosition'
import type { SunlightStatus } from '../value-objects/SunlightStatus'

/**
 * ShadowAnalyzerService Port
 * Defines the interface for analyzing shadows and determining sunlight status
 */
export interface ShadowAnalyzerService {
  /**
   * Analyze sunlight status for a single venue
   * @param venue - The venue to analyze
   * @param nearbyBuildings - Buildings that might cast shadows
   * @param sunPosition - Current sun position
   */
  analyzeVenue(
    venue: Venue,
    nearbyBuildings: Building[],
    sunPosition: SunPosition
  ): SunlightStatus;

  /**
   * Analyze sunlight status for multiple venues
   */
  analyzeVenues(
    venues: Venue[],
    buildings: Building[],
    sunPosition: SunPosition
  ): Map<string, SunlightStatus>;
}
