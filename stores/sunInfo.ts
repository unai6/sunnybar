import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GetSunInfoResult } from '~/application/use-cases/GetSunInfoUseCase'

export const useSunInfoStore = defineStore('sunInfo', () => {
  // State
  const sunInfo = ref<GetSunInfoResult | null>(null)
  const selectedDateTime = ref<Date>(new Date())
  const currentLocation = ref<{ latitude: number; longitude: number } | null>(
    null
  )

  // Actions
  function setSunInfo(info: GetSunInfoResult | null) {
    sunInfo.value = info
  }

  function setSelectedDateTime(datetime: Date) {
    selectedDateTime.value = datetime
  }

  function setCurrentLocation(
    location: { latitude: number; longitude: number } | null
  ) {
    currentLocation.value = location
  }

  return {
    // State
    sunInfo,
    selectedDateTime,
    currentLocation,

    // Actions
    setSunInfo,
    setSelectedDateTime,
    setCurrentLocation
  }
})
