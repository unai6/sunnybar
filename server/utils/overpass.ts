/**
 * Overpass API utility with server-side caching and retry logic
 */

export interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassElement[];
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
  return new Promise((resolve) => setTimeout(resolve, ms))
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
export async function executeOverpassQuery(
  query: string
): Promise<OverpassResponse> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length]

    try {
      const response = await makeOverpassRequest(endpoint, query)

      if (isRetryableStatus(response.status)) {
        console.warn(
          `[Overpass] Status ${response.status}, retrying (${attempt + 1}/${MAX_RETRIES})`
        )
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
      return data
    } catch (err) {
      if (isNuxtError(err)) throw err

      console.warn(
        `[Overpass] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${isAbortError(err) ? 'timeout' : err}`
      )
      lastError = err as Error
      await sleep(INITIAL_DELAY_MS * (attempt + 1))
    }
  }

  console.error('[Overpass] All retries exhausted:', lastError)
  throw createError({
    statusCode: 503,
    statusMessage:
      'Overpass API temporarily unavailable. Please try again later.'
  })
}

/**
 * Build combined venue and building query for bounding box
 * Combines both queries in a single request for better performance
 */
export function buildCombinedQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bboxStr = `${south},${west},${north},${east}`

  // Combined query optimized for speed:
  // - Venues: all amenities in bbox
  // - Buildings: only those with 3+ levels or explicit height (filters out small buildings)
  // - out center: reduces payload size significantly
  return `
    [out:json][timeout:15];
    (
      node["amenity"~"^(bar|restaurant|cafe|pub|biergarten)$"](${bboxStr});
      way["building"]["height"](${bboxStr});
      way["building"]["building:levels"~"^([3-9]|[1-9][0-9]+)$"](${bboxStr});
    );
    out center;
  `
}

/**
 * Build venue query for bounding box (deprecated - use buildCombinedQuery)
 */
export function buildVenueQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bboxStr = `${south},${west},${north},${east}`

  return `
    [out:json][timeout:20];
    node["amenity"~"^(bar|restaurant|cafe|pub|biergarten)$"](${bboxStr});
    out;
  `
}

/**
 * Build building query for bounding box (deprecated - use buildCombinedQuery)
 */
export function buildBuildingQuery(
  south: number,
  west: number,
  north: number,
  east: number
): string {
  const bboxStr = `${south},${west},${north},${east}`

  // Only fetch buildings with height info (relevant for shadow calculations)
  return `
    [out:json][timeout:20];
    (
      way["building"]["height"](${bboxStr});
      way["building"]["building:levels"](${bboxStr});
    );
    out center;
  `
}
