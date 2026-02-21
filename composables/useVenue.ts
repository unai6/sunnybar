import type { SunlightStatusInfo, Venue } from '~/shared/types'
import { useSunlightStatus } from './useSunlightStatus'

/**
 * useVenue Composable
 * Provides utilities for working with venues
 */
export function useVenue() {
  const { isSunny: isSunlightSunny } = useSunlightStatus()

  /**
   * Create a venue with validation
   */
  function create(props: Venue): Venue {
    if (!props.id) {
      throw new Error('Venue must have an id')
    }
    if (!props.name) {
      throw new Error('Venue must have a name')
    }
    return { ...props }
  }

  /**
   * Check if venue is sunny
   */
  function isSunny(venue: Venue): boolean {
    return venue.sunlightStatus ? isSunlightSunny(venue.sunlightStatus) : false
  }

  /**
   * Check if venue has outdoor seating
   */
  function hasOutdoorSeating(venue: Venue): boolean {
    return venue.outdoor_seating === true
  }

  /**
   * Create a new venue with updated sunlight status
   */
  function withSunlightStatus(venue: Venue, status: SunlightStatusInfo): Venue {
    return { ...venue, sunlightStatus: status }
  }

  return {
    create,
    isSunny,
    hasOutdoorSeating,
    withSunlightStatus
  }
}
