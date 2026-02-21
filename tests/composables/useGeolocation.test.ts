import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from '~/composables/useGeolocation'

type GetCurrentPositionCallback = (position: GeolocationPosition) => void;
type GetCurrentPositionErrorCallback = (
  error: GeolocationPositionError,
) => void;

type MockGeolocation = {
  getCurrentPosition: ReturnType<
    typeof vi.fn<
      (
        success: GetCurrentPositionCallback,
        error?: GetCurrentPositionErrorCallback,
        options?: PositionOptions,
      ) => void
    >
  >;
  watchPosition: ReturnType<typeof vi.fn<() => number>>;
  clearWatch: ReturnType<typeof vi.fn<(watchId: number) => void>>;
};

describe('useGeolocation Composable', () => {
  let mockGeolocation: MockGeolocation

  beforeEach(() => {
    mockGeolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(() => 1),
      clearWatch: vi.fn()
    }

    // Mock navigator.geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true
    })
  })

  describe('state', () => {
    it('should initialize with null values', () => {
      const { state } = useGeolocation()
      expect(state.value.latitude).toBeNull()
      expect(state.value.longitude).toBeNull()
      expect(state.value.accuracy).toBeNull()
      expect(state.value.error).toBeNull()
      expect(state.value.loading).toBe(false)
    })
  })

  describe('getCurrentPosition', () => {
    it('should get current position successfully', async () => {
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: GetCurrentPositionCallback) => {
          success(mockPosition)
        }
      )

      const { getCurrentPosition, state } = useGeolocation()
      const position = await getCurrentPosition()

      expect(position).toEqual(mockPosition)
      expect(state.value.latitude).toBe(40.4168)
      expect(state.value.longitude).toBe(-3.7038)
      expect(state.value.accuracy).toBe(10)
      expect(state.value.loading).toBe(false)
      expect(state.value.error).toBeNull()
    })

    it('should handle geolocation errors', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'User denied geolocation',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (
          _success: GetCurrentPositionCallback,
          error?: GetCurrentPositionErrorCallback
        ) => {
          if (error) {
            error(mockError)
          }
        }
      )

      const { getCurrentPosition, state } = useGeolocation()

      await expect(getCurrentPosition()).rejects.toThrow(
        'User denied geolocation'
      )
      expect(state.value.error).toBe('User denied geolocation')
      expect(state.value.loading).toBe(false)
    })

    it('should throw error when geolocation is not supported', async () => {
      // Temporarily remove geolocation
      const originalNavigator = global.navigator
      Object.defineProperty(global, 'navigator', {
        value: {},
        configurable: true,
        writable: true
      })

      const { getCurrentPosition } = useGeolocation()

      await expect(getCurrentPosition()).rejects.toThrow(
        'Geolocation is not supported'
      )

      // Restore navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true
      })
    })

    it('should set loading state during position request', () => {
      let capturedSuccess: GetCurrentPositionCallback | undefined

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: GetCurrentPositionCallback) => {
          capturedSuccess = success
        }
      )

      const { getCurrentPosition, state } = useGeolocation()

      const promise = getCurrentPosition()

      // Should be loading immediately
      expect(state.value.loading).toBe(true)

      // Complete the request
      if (capturedSuccess) {
        capturedSuccess({
          coords: {
            latitude: 40,
            longitude: -3,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({})
          },
          timestamp: Date.now(),
          toJSON: () => ({})
        })
      }

      return promise.then(() => {
        expect(state.value.loading).toBe(false)
      })
    })
  })

  describe('error handling', () => {
    it('should clear previous errors on new request', async () => {
      const mockError: GeolocationPositionError = {
        code: 1,
        message: 'First error',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      }
      const mockPosition: GeolocationPosition = {
        coords: {
          latitude: 40.4168,
          longitude: -3.7038,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
      }

      // First call fails
      mockGeolocation.getCurrentPosition.mockImplementationOnce(
        (
          _success: GetCurrentPositionCallback,
          error?: GetCurrentPositionErrorCallback
        ) => {
          if (error) {
            error(mockError)
          }
        }
      )

      const { getCurrentPosition, state } = useGeolocation()

      await expect(getCurrentPosition()).rejects.toThrow('First error')
      expect(state.value.error).toBe('First error')

      // Second call succeeds
      mockGeolocation.getCurrentPosition.mockImplementationOnce(
        (success: GetCurrentPositionCallback) => {
          success(mockPosition)
        }
      )

      await getCurrentPosition()
      expect(state.value.error).toBeNull()
    })
  })
})
