import type { Venue } from '../entities/Venue'
import type { Coordinates } from '../value-objects/Coordinates'

/**
 * Bounding Box for geographic queries
 */
export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * VenueRepository Port
 * Defines the interface for fetching venues (bars, restaurants, etc.)
 */
export interface VenueRepository {
  /**
   * Find all venues within a bounding box
   */
  findByBoundingBox(bbox: BoundingBox): Promise<Venue[]>;

  /**
   * Find venues near a specific point within a radius
   * @param center - Center point
   * @param radiusMeters - Search radius in meters
   */
  findNearby(center: Coordinates, radiusMeters: number): Promise<Venue[]>;

  /**
   * Get a single venue by ID
   */
  findById(id: string): Promise<Venue | null>;
}
