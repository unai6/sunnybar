import type { Coordinates } from '~/domain/value-objects/Coordinates'
import type { SunlightStatus } from '~/domain/value-objects/SunlightStatus'

/**
 * VenueType - Types of venues we support
 */
export enum VenueType {
  BAR = 'bar',
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  PUB = 'pub',
  BIERGARTEN = 'biergarten'
}

/**
 * Venue Entity
 * Represents a bar, restaurant, or cafe with its location and sunlight status
 */
export interface VenueProps {
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
  sunlightStatus?: SunlightStatus;
}

export class Venue {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: VenueType,
    public readonly coordinates: Coordinates,
    public readonly address?: string,
    public readonly openingHours?: string,
    public readonly outdoor_seating?: boolean,
    public readonly website?: string,
    public readonly phone?: string,
    public readonly rating?: number,
    public readonly priceRange?: string,
    public readonly description?: string,
    public readonly socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    },
    private readonly _sunlightStatus?: SunlightStatus
  ) {}

  static create(props: VenueProps): Venue {
    if (!props.id) {
      throw new Error('Venue must have an id')
    }
    if (!props.name) {
      throw new Error('Venue must have a name')
    }
    return new Venue(
      props.id,
      props.name,
      props.type,
      props.coordinates,
      props.address,
      props.openingHours,
      props.outdoor_seating,
      props.website,
      props.phone,
      props.rating,
      props.priceRange,
      props.description,
      props.socialMedia,
      props.sunlightStatus
    )
  }

  get sunlightStatus(): SunlightStatus | undefined {
    return this._sunlightStatus
  }

  /**
   * Returns a new Venue with updated sunlight status (immutability pattern)
   */
  withSunlightStatus(status: SunlightStatus): Venue {
    return new Venue(
      this.id,
      this.name,
      this.type,
      this.coordinates,
      this.address,
      this.openingHours,
      this.outdoor_seating,
      this.website,
      this.phone,
      this.rating,
      this.priceRange,
      this.description,
      this.socialMedia,
      status
    )
  }

  isSunny(): boolean {
    return this._sunlightStatus?.isSunny() ?? false
  }

  hasOutdoorSeating(): boolean {
    return this.outdoor_seating === true
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      coordinates: this.coordinates.toLatLng(),
      address: this.address,
      openingHours: this.openingHours,
      outdoor_seating: this.outdoor_seating,
      website: this.website,
      phone: this.phone,
      rating: this.rating,
      priceRange: this.priceRange,
      description: this.description,
      socialMedia: this.socialMedia,
      sunlightStatus: this._sunlightStatus ? {
        status: this._sunlightStatus.status,
        confidence: this._sunlightStatus.confidence,
        reason: this._sunlightStatus.reason
      } : undefined
    }
  }
}
