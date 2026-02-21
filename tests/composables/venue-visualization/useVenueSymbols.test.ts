import { describe, expect, it, vi } from 'vitest'
import { useVenueSymbols } from '~/composables/venue-visualization/useVenueSymbols'

type SimpleMarkerSymbolConfig = {
  size: number;
  color: [number, number, number, number];
  outline: { color: [number, number, number, number]; width: number };
};

type MockSimpleMarkerSymbol = {
  size: number;
  color: [number, number, number, number];
  outline: { color: [number, number, number, number]; width: number };
};

describe('useVenueSymbols Composable', () => {
  // Mock SimpleMarkerSymbol constructor
  const mockSimpleMarkerSymbol = vi.fn(
    (config: SimpleMarkerSymbolConfig): MockSimpleMarkerSymbol => ({
      size: config.size,
      color: config.color,
      outline: config.outline
    })
  )

  const { createSunnySymbol, createShadedSymbol } = useVenueSymbols(
    mockSimpleMarkerSymbol as unknown as typeof import('@arcgis/core/symbols/SimpleMarkerSymbol').default
  )

  describe('createSunnySymbol', () => {
    it('should create sunny marker with correct properties', () => {
      const symbol = createSunnySymbol()

      expect(mockSimpleMarkerSymbol).toHaveBeenCalledWith({
        size: 16,
        color: [255, 193, 7, 1],
        outline: { color: [255, 255, 255, 1], width: 2.5 }
      })

      expect(symbol.size).toBe(16)
      expect(symbol.color).toEqual([255, 193, 7, 1])
      expect(symbol.outline.width).toBe(2.5)
    })
  })

  describe('createShadedSymbol', () => {
    it('should create shaded marker with correct properties', () => {
      const symbol = createShadedSymbol()

      expect(mockSimpleMarkerSymbol).toHaveBeenCalledWith({
        size: 12,
        color: [107, 114, 128, 0.85],
        outline: { color: [255, 255, 255, 1], width: 2 }
      })

      expect(symbol.size).toBe(12)
      expect(symbol.color).toEqual([107, 114, 128, 0.85])
      expect(symbol.outline.width).toBe(2)
    })
  })

  describe('symbol differences', () => {
    it('should create different sized markers for sunny vs shaded', () => {
      const sunny = createSunnySymbol()
      const shaded = createShadedSymbol()

      expect(sunny.size).toBeGreaterThan(shaded.size)
    })

    it('should use amber color for sunny and gray for shaded', () => {
      const sunny = createSunnySymbol()
      const shaded = createShadedSymbol()

      // Sunny should be amber (high red, high green, low blue)
      const sunnyColor = sunny.color as unknown as [
        number,
        number,
        number,
        number,
      ]
      expect(sunnyColor[0]).toBe(255) // red
      expect(sunnyColor[1]).toBe(193) // green
      expect(sunnyColor[2]).toBe(7) // blue

      // Shaded should be gray (balanced RGB values)
      const shadedColor = shaded.color as unknown as [
        number,
        number,
        number,
        number,
      ]
      expect(shadedColor[0]).toBe(107)
      expect(shadedColor[1]).toBe(114)
      expect(shadedColor[2]).toBe(128)
    })
  })
})
