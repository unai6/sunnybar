import type { Venue } from '../../domain/entities/Venue'
import type { VenueRepository, BoundingBox } from '../../domain/repositories/VenueRepository'
import type { BuildingRepository } from '../../domain/repositories/BuildingRepository'
import type { SunCalculatorService } from '../../domain/services/SunCalculatorService'
import type { ShadowAnalyzerService } from '../../domain/services/ShadowAnalyzerService'
import { Coordinates } from '../../domain/value-objects/Coordinates'

export interface GetSunnyVenuesQuery {
  bbox?: BoundingBox;
  center?: { latitude: number; longitude: number };
  radiusMeters?: number;
  datetime?: Date;
  onlySunny?: boolean;
  onlyWithOutdoorSeating?: boolean;
}

export interface GetSunnyVenuesResult {
  venues: Venue[];
  sunnyCount: number;
  shadedCount: number;
  timestamp: Date;
  sunPosition: {
    azimuthDegrees: number;
    altitudeDegrees: number;
    isAboveHorizon: boolean;
  };
}

/**
 * GetSunnyVenues Use Case
 * Fetches venues and analyzes their sunlight status
 */
export class GetSunnyVenuesUseCase {
  constructor(
    private readonly venueRepository: VenueRepository,
    private readonly buildingRepository: BuildingRepository,
    private readonly sunCalculator: SunCalculatorService,
    private readonly shadowAnalyzer: ShadowAnalyzerService
  ) {}

  async execute(query: GetSunnyVenuesQuery): Promise<GetSunnyVenuesResult> {
    const datetime = query.datetime || new Date()

    // Fetch venues
    let venues: Venue[]
    let referenceCoords: Coordinates

    if (query.bbox) {
      venues = await this.venueRepository.findByBoundingBox(query.bbox)
      // Use center of bbox as reference for sun position
      referenceCoords = Coordinates.create({
        latitude: (query.bbox.north + query.bbox.south) / 2,
        longitude: (query.bbox.east + query.bbox.west) / 2
      })
    } else if (query.center && query.radiusMeters) {
      const center = Coordinates.create(query.center)
      venues = await this.venueRepository.findNearby(center, query.radiusMeters)
      referenceCoords = center
    } else {
      throw new Error('Either bbox or center+radiusMeters must be provided')
    }

    // Filter by outdoor seating if requested
    if (query.onlyWithOutdoorSeating) {
      venues = venues.filter(v => v.hasOutdoorSeating())
    }

    // Calculate sun position
    const sunPosition = this.sunCalculator.getPosition(referenceCoords, datetime)

    // Fetch nearby buildings for shadow analysis
    const buildings = query.bbox
      ? await this.buildingRepository.findByBoundingBox(query.bbox)
      : await this.buildingRepository.findNearby(referenceCoords, query.radiusMeters! + 100)

    // Analyze sunlight status for all venues
    const sunlightStatuses = this.shadowAnalyzer.analyzeVenues(venues, buildings, sunPosition)

    // Update venues with their sunlight status
    let venuesWithStatus = venues.map(venue => {
      const status = sunlightStatuses.get(venue.id)
      return status ? venue.withSunlightStatus(status) : venue
    })

    // Count sunny and shaded
    const sunnyCount = venuesWithStatus.filter(v => v.isSunny()).length
    const shadedCount = venuesWithStatus.length - sunnyCount

    // Filter to only sunny if requested
    if (query.onlySunny) {
      venuesWithStatus = venuesWithStatus.filter(v => v.isSunny())
    }

    return {
      venues: venuesWithStatus,
      sunnyCount,
      shadedCount,
      timestamp: datetime,
      sunPosition: {
        azimuthDegrees: sunPosition.getAzimuthDegrees(),
        altitudeDegrees: sunPosition.getAltitudeDegrees(),
        isAboveHorizon: sunPosition.isAboveHorizon()
      }
    }
  }
}
