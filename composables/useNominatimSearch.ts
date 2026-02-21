import { ref } from 'vue'

interface SearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  bounds: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
  type: string;
}

/**
 * useNominatimSearch Composable
 * Search for places using server-side Nominatim geocoding API
 */
export function useNominatimSearch() {
  const searchResults = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const searchError = ref<string | null>(null)

  /**
   * Search for a place by name
   * @param query Search query (e.g., "La Rambla Barcelona", "Plaza Mayor Madrid")
   * @returns Array of search results
   */
  async function searchPlace(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 3) {
      searchResults.value = []
      return []
    }

    isSearching.value = true
    searchError.value = null

    try {
      // Call server API endpoint
      const response = await $fetch<{ results: SearchResult[]; count: number }>(
        '/api/search',
        {
          query: {
            q: query,
            limit: 5
          }
        }
      )

      searchResults.value = response.results
      return response.results
    } catch (error) {
      console.error('Search error:', error)
      searchError.value = 'search.error.failed'
      searchResults.value = []
      return []
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Reverse geocode: get address from coordinates
   * @param latitude Latitude
   * @param longitude Longitude
   * @returns Address string
   */
  async function reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      // Call server API endpoint
      const response = await $fetch<{ address: string | null; found: boolean }>(
        '/api/reverse-geocode',
        {
          query: {
            lat: latitude,
            lon: longitude
          }
        }
      )

      return response.address
    } catch (error) {
      console.error('Reverse geocode error:', error)
      return null
    }
  }

  /**
   * Clear search results
   */
  function clearResults(): void {
    searchResults.value = []
    searchError.value = null
  }

  return {
    searchResults,
    isSearching,
    searchError,
    searchPlace,
    reverseGeocode,
    clearResults
  }
}
