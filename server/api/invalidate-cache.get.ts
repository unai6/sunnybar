

/**
 * GET /api/invalidate-cache?key=...
 *
 * Invalidates a cached API response by cache key.
 * Example: /api/invalidate-cache?key=venues:40.1234,-3.1234,40.5678,-3.5678:2026-2-18-12
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const key = query.key as string | undefined

  try {
    if (!key || key === 'all') {
      // Delete all cache (be careful: this clears all cached endpoints, not just venues)
      await useStorage('cache').clear()
      return { success: true, message: 'All cache cleared.' }
    } else {
      await useStorage('cache').removeItem(key)
      return { success: true, message: `Cache invalidated for key: ${key}` }
    }
  } catch {
    return { success: false, message: `Failed to invalidate cache${key ? ' for key: ' + key : ''}` }
  }
})
