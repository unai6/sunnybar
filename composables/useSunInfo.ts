import { storeToRefs } from 'pinia'
import { useSunInfoStore } from '~/stores/sunInfo'
import { useCoordinates } from './useCoordinates'
import { useSunCalculator } from './useSunCalculator'
import { useSunPosition } from './useSunPosition'

/**
 * useSunInfo Composable
 * Manages sun information state and provides sun calculation actions
 * Combines Pinia store for shared state with business logic
 */
export function useSunInfo() {
  const store = useSunInfoStore()
  const { sunInfo, selectedDateTime, currentLocation } = storeToRefs(store)
  const coordinates = useCoordinates()
  const sunCalculator = useSunCalculator()
  const sunPosition = useSunPosition()

  /**
   * Update sun information for a specific location and time
   */
  function updateSunInfo(
    latitude: number,
    longitude: number,
    date?: Date
  ): void {
    try {
      const datetime = date || selectedDateTime.value
      const coords = coordinates.create(latitude, longitude)

      const position = sunCalculator.getPosition(coords, datetime)
      const times = sunCalculator.getSunTimes(coords, datetime)
      const daytime = sunCalculator.isDaytime(coords, datetime)

      store.sunInfo = {
        position: {
          azimuthDegrees: sunPosition.getAzimuthDegrees(position),
          altitudeDegrees: sunPosition.getAltitudeDegrees(position),
          isAboveHorizon: sunPosition.isAboveHorizon(position)
        },
        times,
        isDaytime: daytime
      }

      store.currentLocation = { latitude, longitude }
    } catch {
      store.sunInfo = null
    }
  }

  /**
   * Update the selected date/time and recalculate sun info if location is set
   */
  function setDateTime(datetime: Date): void {
    store.selectedDateTime = datetime

    if (currentLocation.value) {
      updateSunInfo(
        currentLocation.value.latitude,
        currentLocation.value.longitude,
        datetime
      )
    }
  }

  return {
    // State
    sunInfo,
    selectedDateTime,
    currentLocation,

    // Actions
    updateSunInfo,
    setDateTime
  }
}
