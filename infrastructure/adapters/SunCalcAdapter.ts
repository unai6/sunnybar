import SunCalc from 'suncalc'
import type { SunCalculatorService } from '../../domain/services/SunCalculatorService'
import type { Coordinates } from '../../domain/value-objects/Coordinates'
import { SunPosition } from '../../domain/value-objects/SunPosition'

/**
 * SunCalc Adapter
 * Implements SunCalculatorService using the SunCalc library
 */
export class SunCalcAdapter implements SunCalculatorService {
  getPosition(coordinates: Coordinates, datetime: Date): SunPosition {
    const position = SunCalc.getPosition(
      datetime,
      coordinates.latitude,
      coordinates.longitude
    )

    return SunPosition.create({
      azimuth: position.azimuth,
      altitude: position.altitude,
      timestamp: datetime
    })
  }

  getSunTimes(coordinates: Coordinates, date: Date): {
    sunrise: Date;
    sunset: Date;
    solarNoon: Date;
    goldenHour: Date;
  } {
    const times = SunCalc.getTimes(
      date,
      coordinates.latitude,
      coordinates.longitude
    )

    return {
      sunrise: times.sunrise,
      sunset: times.sunset,
      solarNoon: times.solarNoon,
      goldenHour: times.goldenHour
    }
  }

  isDaytime(coordinates: Coordinates, datetime: Date): boolean {
    const position = this.getPosition(coordinates, datetime)
    return position.isAboveHorizon()
  }
}
