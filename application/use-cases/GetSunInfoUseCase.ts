import type { SunCalculatorService } from '../../domain/services/SunCalculatorService'
import { Coordinates } from '../../domain/value-objects/Coordinates'

export interface GetSunInfoQuery {
  latitude: number;
  longitude: number;
  date?: Date;
}

export interface GetSunInfoResult {
  position: {
    azimuthDegrees: number;
    altitudeDegrees: number;
    isAboveHorizon: boolean;
  };
  times: {
    sunrise: Date;
    sunset: Date;
    solarNoon: Date;
    goldenHour: Date;
  };
  isDaytime: boolean;
}

/**
 * GetSunInfo Use Case
 * Gets sun position and times for a location
 */
export class GetSunInfoUseCase {
  constructor(
    private readonly sunCalculator: SunCalculatorService
  ) {}

  execute(query: GetSunInfoQuery): GetSunInfoResult {
    const date = query.date || new Date()
    const coordinates = Coordinates.create({
      latitude: query.latitude,
      longitude: query.longitude
    })

    const position = this.sunCalculator.getPosition(coordinates, date)
    const times = this.sunCalculator.getSunTimes(coordinates, date)
    const isDaytime = this.sunCalculator.isDaytime(coordinates, date)

    return {
      position: {
        azimuthDegrees: position.getAzimuthDegrees(),
        altitudeDegrees: position.getAltitudeDegrees(),
        isAboveHorizon: position.isAboveHorizon()
      },
      times,
      isDaytime
    }
  }
}
