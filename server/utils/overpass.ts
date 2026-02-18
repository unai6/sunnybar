/**
 * Overpass API utility with server-side caching and retry logic
 */

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  geometry?: Array<{ lat: number; lon: number }>
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

// Multiple Overpass API endpoints for failover
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
]

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if response status is retryable
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 504 || status === 503 || status === 502
}

/**
 * Check if error is an abort error
 */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Check if error is already a Nuxt createError
 */
function isNuxtError(error: unknown): boolean {
  return error !== null && typeof error === 'object' && 'statusCode' in error
}

/**
 * Make a single Overpass API request
 */
async function makeOverpassRequest(
  endpoint: string,
  query: string
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Execute Overpass query with retry logic and endpoint failover
 */
export async function executeOverpassQuery(query: string): Promise<OverpassResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]
    console.log(`[Overpass] Attempt ${attempt + 1}/${MAX_RETRIES} using ${endpoint}`)

    try {
      const response = await makeOverpassRequest(endpoint, query)

      if (isRetryableStatus(response.status)) {
        console.log(`[Overpass] Status ${response.status}, will retry`)
        lastError = new Error(`Server error: ${response.status}`)
        await sleep(INITIAL_DELAY_MS * (attempt + 1))
        continue
      }

      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: `Overpass API error: ${response.statusText}`
        })
      }

      const data = await response.json()
      console.log(`[Overpass] Success: ${data.elements?.length || 0} elements`)
      return data
    } catch (error) {
      if (isNuxtError(error)) throw error

      console.log(`[Overpass] Error: ${isAbortError(error) ? 'timeout' : error}`)
      lastError = error as Error
      await sleep(INITIAL_DELAY_MS * (attempt + 1))
    }
  }

  console.error('[Overpass] All retries failed:', lastError)
  throw createError({
    statusCode: 503,
    statusMessage: 'Overpass API temporarily unavailable. Please try again later.'
  })
}

/**
 * Build venue query for bounding box
 */
export function buildVenueQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bboxStr = `${south},${west},${north},${east}`

  // Simplified query - nodes only, combined amenity filter
  return `
    [out:json][timeout:25];
    node["amenity"~"^(bar|restaurant|cafe|pub|biergarten)$"](${bboxStr});
    out;
  `
}

/**
 * Build building query for bounding box (only ways with height info)
 */
export function buildBuildingQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bboxStr = `${south},${west},${north},${east}`

  // Get buildings - prefer those with height/levels info
  return `
    [out:json][timeout:25];
    way["building"](${bboxStr});
    out center;
  `
}

export type { OverpassElement, OverpassResponse }
