import { ref, computed } from 'vue'
import { GetSunInfoUseCase, type GetSunInfoResult } from '~/application/use-cases/GetSunInfoUseCase'
import { SunCalcAdapter } from '~/infrastructure/adapters/SunCalcAdapter'

export function useSunInfo() {
  // State
  const sunInfo = ref<GetSunInfoResult | null>(null)
  const selectedDateTime = ref<Date>(new Date())
  const currentLocation = ref<{ latitude: number; longitude: number } | null>(null)

  // Computed
  const isNightTime = computed(() => {
    return sunInfo.value ? !sunInfo.value.isDaytime : false
  })

  const sunAltitude = computed(() => {
    return sunInfo.value?.position.altitudeDegrees ?? 0
  })

  const sunAzimuth = computed(() => {
    return sunInfo.value?.position.azimuthDegrees ?? 0
  })

  const sunriseTime = computed(() => {
    return sunInfo.value?.times.sunrise ?? null
  })

  const sunsetTime = computed(() => {
    return sunInfo.value?.times.sunset ?? null
  })

  const formattedSunrise = computed(() => {
    if (!sunriseTime.value) return '--:--'
    return sunriseTime.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })

  const formattedSunset = computed(() => {
    if (!sunsetTime.value) return '--:--'
    return sunsetTime.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })

  // Create use case
  const createUseCase = (): GetSunInfoUseCase => {
    const sunCalculator = new SunCalcAdapter()
    return new GetSunInfoUseCase(sunCalculator)
  }

  // Actions
  const updateSunInfo = (latitude: number, longitude: number, date?: Date): void => {
    const useCase = createUseCase()
    const datetime = date || selectedDateTime.value

    sunInfo.value = useCase.execute({
      latitude,
      longitude,
      date: datetime
    })

    currentLocation.value = { latitude, longitude }
  }

  const setDateTime = (datetime: Date): void => {
    selectedDateTime.value = datetime

    if (currentLocation.value) {
      updateSunInfo(
        currentLocation.value.latitude,
        currentLocation.value.longitude,
        datetime
      )
    }
  }

  const setToCurrentTime = (): void => {
    setDateTime(new Date())
  }

  const addHours = (hours: number): void => {
    const newDate = new Date(selectedDateTime.value)
    newDate.setHours(newDate.getHours() + hours)
    setDateTime(newDate)
  }

  return {
    // State
    sunInfo,
    selectedDateTime,
    currentLocation,

    // Computed
    isNightTime,
    sunAltitude,
    sunAzimuth,
    sunriseTime,
    sunsetTime,
    formattedSunrise,
    formattedSunset,

    // Actions
    updateSunInfo,
    setDateTime,
    setToCurrentTime,
    addHours
  }
}
