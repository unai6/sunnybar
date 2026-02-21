import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useMapBounds } from '~/composables/map-interaction/useMapBounds'

type MockMapView = {
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
};

type BoundsEmit = {
  south: number;
  west: number;
  north: number;
  east: number;
};

type WebMercatorExtent = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

describe('useMapBounds Composable', () => {
  let mockView: MockMapView
  let mockEmit: ReturnType<typeof vi.fn<(bounds: BoundsEmit) => void>>
  let mockWebMercatorToGeographic: ReturnType<
    typeof vi.fn<(extent: WebMercatorExtent) => WebMercatorExtent>
  > &
    typeof import('@arcgis/core/geometry/support/webMercatorUtils').webMercatorToGeographic

  beforeEach(() => {
    vi.useFakeTimers()

    mockView = {
      extent: {
        xmin: -10,
        ymin: 40,
        xmax: -5,
        ymax: 45
      }
    }

    mockEmit = vi.fn()

    mockWebMercatorToGeographic = vi.fn((extent) => ({
      xmin: extent.xmin,
      ymin: extent.ymin,
      xmax: extent.xmax,
      ymax: extent.ymax
    })) as unknown as ReturnType<
      typeof vi.fn<(extent: WebMercatorExtent) => WebMercatorExtent>
    > &
      typeof import('@arcgis/core/geometry/support/webMercatorUtils').webMercatorToGeographic
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('emitBounds', () => {
    it('should debounce bounds emissions', () => {
      const { emitBounds } = useMapBounds(mockWebMercatorToGeographic)

      emitBounds(mockView as unknown as __esri.MapView, mockEmit)
      emitBounds(mockView as unknown as __esri.MapView, mockEmit)
      emitBounds(mockView as unknown as __esri.MapView, mockEmit)

      // Should not emit immediately due to debounce
      expect(mockEmit).not.toHaveBeenCalled()

      // Fast-forward time past debounce delay
      vi.advanceTimersByTime(500)

      // Should emit once after debounce
      expect(mockEmit).toHaveBeenCalledTimes(1)
      expect(mockEmit).toHaveBeenCalledWith({
        south: 40,
        west: -10,
        north: 45,
        east: -5
      })
    })

    it('should handle null view gracefully', () => {
      const { emitBounds } = useMapBounds(mockWebMercatorToGeographic)

      emitBounds(null, mockEmit)
      vi.advanceTimersByTime(500)

      expect(mockEmit).not.toHaveBeenCalled()
    })
  })

  describe('emitBoundsImmediate', () => {
    it('should emit bounds without debouncing', () => {
      const { emitBoundsImmediate } = useMapBounds(mockWebMercatorToGeographic)

      emitBoundsImmediate(mockView as unknown as __esri.MapView, mockEmit)

      // Should emit immediately
      expect(mockEmit).toHaveBeenCalledTimes(1)
      expect(mockEmit).toHaveBeenCalledWith({
        south: 40,
        west: -10,
        north: 45,
        east: -5
      })
    })

    it('should handle null view gracefully', () => {
      const { emitBoundsImmediate } = useMapBounds(mockWebMercatorToGeographic)

      emitBoundsImmediate(null, mockEmit)

      expect(mockEmit).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should clear pending timeouts', () => {
      const { emitBounds, cleanup } = useMapBounds(mockWebMercatorToGeographic)

      emitBounds(mockView as unknown as __esri.MapView, mockEmit)
      cleanup()

      vi.advanceTimersByTime(500)

      // Should not emit after cleanup
      expect(mockEmit).not.toHaveBeenCalled()
    })
  })
})
