/**
 * Coordinates Value Object
 * Represents a geographic location with latitude and longitude
 */
export interface CoordinatesProps {
  latitude: number;
  longitude: number;
}

export class Coordinates {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number
  ) {}

  static create(props: CoordinatesProps): Coordinates {
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90')
    }
    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180')
    }
    return new Coordinates(props.latitude, props.longitude)
  }

  toArray(): [number, number] {
    return [this.latitude, this.longitude]
  }

  toLatLng(): { lat: number; lng: number } {
    return { lat: this.latitude, lng: this.longitude }
  }

  equals(other: Coordinates): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude
  }

  distanceTo(other: Coordinates): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = (this.latitude * Math.PI) / 180
    const φ2 = (other.latitude * Math.PI) / 180
    const Δφ = ((other.latitude - this.latitude) * Math.PI) / 180
    const Δλ = ((other.longitude - this.longitude) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }
}
