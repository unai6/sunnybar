import { ref } from 'vue'
import { GetSunInfoUseCase, type GetSunInfoResult } from '~/application/use-cases/GetSunInfoUseCase'
import { SunCalcAdapter } from '~/infrastructure/adapters/SunCalcAdapter'

export function useSunInfo() {
  // Create use case
  function createUseCase(): GetSunInfoUseCase {
    const sunCalculator = new SunCalcAdapter()
    return new GetSunInfoUseCase(sunCalculator)
  }

  // Actions
  function updateSunInfo(latitude: number, longitude: number, date?: Date): void {
    const datetime = date || selectedDateTime.value
    const { data, error } = attemptSync(() =>
      createUseCase().execute({ latitude, longitude, date: datetime })
    )

    if (error) {
      sunInfo.value = null
      return
    }

    sunInfo.value = data
    currentLocation.value = { latitude, longitude }
  }

  function setDateTime(datetime: Date): void {
    selectedDateTime.value = datetime

    if (currentLocation.value) {
      updateSunInfo(
        currentLocation.value.latitude,
        currentLocation.value.longitude,
        datetime
      )
    }
  }
  // State
  const sunInfo = ref<GetSunInfoResult | null>(null)
  const selectedDateTime = ref<Date>(new Date())
  const currentLocation = ref<{ latitude: number; longitude: number } | null>(null)


  return {
    // State
    sunInfo,
    selectedDateTime,

    // Actions
    updateSunInfo,
    setDateTime
  }
}
