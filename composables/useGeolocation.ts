import { ref, onMounted } from 'vue'

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const state = ref<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false
  })

  const isSupported = ref(false)

  onMounted(() => {
    isSupported.value = 'geolocation' in navigator
  })

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      state.value.loading = true
      state.value.error = null

      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.value.latitude = position.coords.latitude
          state.value.longitude = position.coords.longitude
          state.value.accuracy = position.coords.accuracy
          state.value.loading = false
          resolve(position)
        },
        (err) => {
          state.value.error = err.message
          state.value.loading = false
          reject(err)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  const hasLocation = (): boolean => {
    return state.value.latitude !== null && state.value.longitude !== null
  }

  return {
    state,
    isSupported,
    getCurrentPosition,
    hasLocation
  }
}
