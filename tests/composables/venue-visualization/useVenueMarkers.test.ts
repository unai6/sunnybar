import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useVenueMarkers } from '~/composables/venue-visualization/useVenueMarkers'
import { SunlightStatus } from '~/shared/enums'
import type { Venue } from '~/shared/types'

type MockGraphic = {
  geometry: MockPoint;
  symbol: MockSymbol;
  attributes: Record<string, unknown>;
};

type MockPoint = {
  longitude: number;
  latitude: number;
};

type MockSymbol = {
  type: string;
};

type MockGraphicsLayer = {
  graphics: {
    forEach: (callback: (graphic: MockGraphic) => void) => void;
  };
  remove: (graphic: MockGraphic) => void;
  addMany: (graphics: MockGraphic[]) => void;
};

type GraphicConfig = {
  geometry: MockPoint;
  symbol: MockSymbol;
  attributes: Record<string, unknown>;
};

type PointConfig = {
  longitude: number;
  latitude: number;
};

describe('useVenueMarkers Composable', () => {
  type GraphicConstructor = new (config: GraphicConfig) => MockGraphic;
  type PointConstructor = new (config: PointConfig) => MockPoint;

  let mockGraphic: GraphicConstructor
  let mockPoint: PointConstructor
  let mockGraphicsLayer: MockGraphicsLayer
  let mockCreateSunnySymbol: ReturnType<typeof vi.fn<() => MockSymbol>>
  let mockCreateShadedSymbol: ReturnType<typeof vi.fn<() => MockSymbol>>
  let mockIsSunny: ReturnType<typeof vi.fn<(venue: Venue) => boolean>>
  let createdGraphics: MockGraphic[]

  beforeEach(() => {
    createdGraphics = []

    mockGraphic = vi.fn((config: GraphicConfig): MockGraphic => {
      const graphic = {
        geometry: config.geometry,
        symbol: config.symbol,
        attributes: config.attributes
      }
      createdGraphics.push(graphic)
      return graphic
    }) as unknown as GraphicConstructor

    mockPoint = vi.fn(
      (config: PointConfig): MockPoint => ({
        longitude: config.longitude,
        latitude: config.latitude
      })
    ) as unknown as PointConstructor

    mockGraphicsLayer = {
      graphics: {
        forEach: vi.fn((callback: (graphic: MockGraphic) => void) => {
          createdGraphics.forEach(callback)
        })
      },
      remove: vi.fn(),
      addMany: vi.fn()
    }

    mockCreateSunnySymbol = vi.fn((): MockSymbol => ({ type: 'sunny' }))
    mockCreateShadedSymbol = vi.fn((): MockSymbol => ({ type: 'shaded' }))
    mockIsSunny = vi.fn(
      (venue: Venue): boolean =>
        venue.sunlightStatus?.status === SunlightStatus.SUNNY
    )
  })

  describe('updateMarkers', () => {
    it('should create markers for new venues', () => {
      const { updateMarkers } = useVenueMarkers(
        mockGraphic as unknown as typeof import('@arcgis/core/Graphic').default,
        mockPoint as unknown as typeof import('@arcgis/core/geometry/Point').default,
        mockCreateSunnySymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockCreateShadedSymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockIsSunny
      )

      const venues: Venue[] = [
        {
          id: '1',
          name: 'Sunny Bar',
          type: 'bar',
          coordinates: { latitude: 40.4168, longitude: -3.7038 },
          sunlightStatus: { status: SunlightStatus.SUNNY, confidence: 1 }
        },
        {
          id: '2',
          name: 'Shaded Cafe',
          type: 'cafe',
          coordinates: { latitude: 40.4169, longitude: -3.7039 },
          sunlightStatus: { status: SunlightStatus.SHADED, confidence: 1 }
        }
      ]

      updateMarkers(
        mockGraphicsLayer as unknown as __esri.GraphicsLayer,
        venues
      )

      expect(mockGraphic).toHaveBeenCalledTimes(2)
      expect(mockPoint).toHaveBeenCalledTimes(2)
      expect(mockCreateSunnySymbol).toHaveBeenCalledTimes(1)
      expect(mockCreateShadedSymbol).toHaveBeenCalledTimes(1)
      expect(mockGraphicsLayer.addMany).toHaveBeenCalledTimes(1)
      expect(mockGraphicsLayer.addMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            attributes: expect.objectContaining({ id: '1' })
          }),
          expect.objectContaining({
            attributes: expect.objectContaining({ id: '2' })
          })
        ])
      )
    })

    it('should handle empty venue list', () => {
      const { updateMarkers } = useVenueMarkers(
        mockGraphic as unknown as typeof import('@arcgis/core/Graphic').default,
        mockPoint as unknown as typeof import('@arcgis/core/geometry/Point').default,
        mockCreateSunnySymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockCreateShadedSymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockIsSunny
      )

      updateMarkers(mockGraphicsLayer as unknown as __esri.GraphicsLayer, [])

      expect(mockGraphicsLayer.addMany).not.toHaveBeenCalled()
    })

    it('should handle null graphics layer', () => {
      const { updateMarkers } = useVenueMarkers(
        mockGraphic as unknown as typeof import('@arcgis/core/Graphic').default,
        mockPoint as unknown as typeof import('@arcgis/core/geometry/Point').default,
        mockCreateSunnySymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockCreateShadedSymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockIsSunny
      )

      const venues: Venue[] = [
        {
          id: '1',
          name: 'Test Bar',
          type: 'bar',
          coordinates: { latitude: 40.4168, longitude: -3.7038 }
        }
      ]

      // Should not throw error
      expect(() => updateMarkers(null, venues)).not.toThrow()
      expect(mockGraphic).not.toHaveBeenCalled()
    })

    it('should include venue attributes in graphics', () => {
      const { updateMarkers } = useVenueMarkers(
        mockGraphic as unknown as typeof import('@arcgis/core/Graphic').default,
        mockPoint as unknown as typeof import('@arcgis/core/geometry/Point').default,
        mockCreateSunnySymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockCreateShadedSymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockIsSunny
      )

      const venue: Venue = {
        id: '1',
        name: 'Test Restaurant',
        type: 'restaurant',
        coordinates: { latitude: 40.4168, longitude: -3.7038 },
        address: '123 Main St',
        outdoor_seating: true,
        sunlightStatus: { status: SunlightStatus.SUNNY, confidence: 1 }
      }

      updateMarkers(mockGraphicsLayer as unknown as __esri.GraphicsLayer, [
        venue
      ])

      expect(mockGraphic).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.objectContaining({
            id: '1',
            name: 'Test Restaurant',
            type: 'restaurant',
            isSunny: true,
            address: '123 Main St',
            outdoor_seating: true
          })
        })
      )
    })

    it('should create point with correct coordinates', () => {
      const { updateMarkers } = useVenueMarkers(
        mockGraphic as unknown as typeof import('@arcgis/core/Graphic').default,
        mockPoint as unknown as typeof import('@arcgis/core/geometry/Point').default,
        mockCreateSunnySymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockCreateShadedSymbol as unknown as () => __esri.SimpleMarkerSymbol,
        mockIsSunny
      )

      const venue: Venue = {
        id: '1',
        name: 'Test Pub',
        type: 'pub',
        coordinates: { latitude: 41.3851, longitude: 2.1734 }
      }

      updateMarkers(mockGraphicsLayer as unknown as __esri.GraphicsLayer, [
        venue
      ])

      expect(mockPoint).toHaveBeenCalledWith({
        longitude: 2.1734,
        latitude: 41.3851
      })
    })
  })
})
