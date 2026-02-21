/**
 * useVenueSymbols Composable
 * Creates marker symbols for sunny and shaded venues
 */
export function useVenueSymbols(
  SimpleMarkerSymbol: typeof import('@arcgis/core/symbols/SimpleMarkerSymbol').default
) {
  function createSunnySymbol(): __esri.SimpleMarkerSymbol {
    return new SimpleMarkerSymbol({
      size: 16,
      color: [255, 193, 7, 1],
      outline: { color: [255, 255, 255, 1], width: 2.5 }
    })
  }

  function createShadedSymbol(): __esri.SimpleMarkerSymbol {
    return new SimpleMarkerSymbol({
      size: 12,
      color: [107, 114, 128, 0.85],
      outline: { color: [255, 255, 255, 1], width: 2 }
    })
  }

  return {
    createSunnySymbol,
    createShadedSymbol
  }
}
