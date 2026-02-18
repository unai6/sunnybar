import type { Building } from '../entities/Building'
import type { BoundingBox } from './VenueRepository'
import type { Coordinates } from '../value-objects/Coordinates'

/**
 * BuildingRepository Port
 * Defines the interface for fetching buildings (for shadow calculation)
 */
export interface BuildingRepository {
  /**
   * Find all buildings within a bounding box
   */
  findByBoundingBox(bbox: BoundingBox): Promise<Building[]>;

  /**
   * Find buildings near a specific point
   * @param center - Center point
   * @param radiusMeters - Search radius in meters
   */
  findNearby(center: Coordinates, radiusMeters: number): Promise<Building[]>;
}
