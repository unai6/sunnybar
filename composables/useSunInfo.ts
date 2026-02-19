import { storeToRefs } from 'pinia'
import {
    GetSunInfoUseCase
} from '~/application/use-cases/GetSunInfoUseCase'
import { SunCalcAdapter } from '~/infrastructure/adapters/SunCalcAdapter'
import { useSunInfoStore } from '~/stores/sunInfo'

export function useSunInfo() {
  // Use Pinia store for framework-agnostic state management
  const store = useSunInfoStore()
  const { sunInfo, selectedDateTime, currentLocation } = storeToRefs(store)

  // Create use case
  function createUseCase(): GetSunInfoUseCase {
    const sunCalculator = new SunCalcAdapter()
    return new GetSunInfoUseCase(sunCalculator)
  }

  // Actions
  function updateSunInfo(
    latitude: number,
    longitude: number,
    date?: Date
  ): void {
    const datetime = date || selectedDateTime.value
    const { data, error } = attemptSync(() =>
      createUseCase().execute({ latitude, longitude, date: datetime })
    )

    if (error) {
      store.setSunInfo(null)
      return
    }

    store.setSunInfo(data)
    store.setCurrentLocation({ latitude, longitude })
  }

  function setDateTime(datetime: Date): void {
    store.setSelectedDateTime(datetime)

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

    // Actions
    updateSunInfo,
    setDateTime
  }
}
