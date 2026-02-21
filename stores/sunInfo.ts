import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SunInfo {
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
 * Sun Info Store
 * Holds shared state for sun information across the app
 * Business logic is handled in the useSunInfo composable
 */
export const useSunInfoStore = defineStore('sunInfo', () => {
  const sunInfo = ref<SunInfo | null>(null)
  const selectedDateTime = ref<Date>(new Date())
  const currentLocation = ref<{ latitude: number; longitude: number } | null>(
    null
  )

  return {
    sunInfo,
    selectedDateTime,
    currentLocation
  }
})
