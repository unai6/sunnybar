import type { Coordinates } from './coordinates'
import type { SunlightStatusInfo } from './sunlight-status'
import type { VenueType } from './venue-type'

/**
 * Venue Type
 * Represents a bar, restaurant, or cafe with its location and sunlight status
 */
export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  coordinates: Coordinates;
  address?: string;
  openingHours?: string;
  outdoor_seating?: boolean;
  website?: string;
  phone?: string;
  rating?: number;
  priceRange?: string;
  description?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  sunlightStatus?: SunlightStatusInfo;
}
