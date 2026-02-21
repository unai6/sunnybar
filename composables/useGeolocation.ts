import { ref } from 'vue'
import { GeolocationErrorType } from '~/shared/enums'
import type { GeolocationState } from '~/shared/types'

const GEOLOCATION_TIMEOUT_MS = 10000
const GEOLOCATION_MAX_AGE_MS = 0 // Always request fresh position to trigger permission prompt

export { GeolocationErrorType }
export type { GeolocationState }

export function useGeolocation() {
  const state = ref<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    errorType: null,
    loading: false
  })

  /**
   * Maps GeolocationPositionError code to our error type
   */
  function getErrorType(code: number): GeolocationErrorType {
    switch (code) {
      case 1: // PERMISSION_DENIED
        return GeolocationErrorType.PERMISSION_DENIED
      case 2: // POSITION_UNAVAILABLE
        return GeolocationErrorType.POSITION_UNAVAILABLE
      case 3: // TIMEOUT
        return GeolocationErrorType.TIMEOUT
      default:
        return GeolocationErrorType.UNKNOWN
    }
  }

  /**
   * Check permission state using Permissions API (when available)
   * This helps provide better UX across different browsers
   */
  async function checkPermission(): Promise<PermissionState | null> {
    if (!('permissions' in navigator)) {
      return null
    }

    try {
      const result = await navigator.permissions.query({
        name: 'geolocation' as PermissionName
      })
      return result.state
    } catch {
      // Permissions API not fully supported (Safari) or query failed
      return null
    }
  }

  /**
   * Get current position with proper error handling for all browsers
   * Always attempts to get position, which triggers permission prompt if needed
   */
  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const error = new Error('Geolocation is not supported')
        state.value.error = error.message
        state.value.errorType = GeolocationErrorType.NOT_SUPPORTED
        state.value.loading = false
        reject(error)
        return
      }

      state.value.loading = true
      state.value.error = null
      state.value.errorType = null

      // Always call getCurrentPosition to trigger permission prompt
      // Safari and Firefox will show the prompt again if not permanently denied
      navigator.geolocation.getCurrentPosition(
        (position) => {
          state.value.latitude = position.coords.latitude
          state.value.longitude = position.coords.longitude
          state.value.accuracy = position.coords.accuracy
          state.value.error = null
          state.value.errorType = null
          state.value.loading = false
          resolve(position)
        },
        (err) => {
          const errorType = getErrorType(err.code)
          state.value.error = err.message
          state.value.errorType = errorType
          state.value.loading = false
          reject(err)
        },
        {
          enableHighAccuracy: true,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: GEOLOCATION_MAX_AGE_MS
        }
      )
    })
  }

  return {
    state,
    getCurrentPosition,
    checkPermission
  }
}
