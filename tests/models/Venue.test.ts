import { describe, expect, it } from 'vitest'
import { useCoordinates } from '~/composables/useCoordinates'
import { useSunlightStatus } from '~/composables/useSunlightStatus'
import { useVenue } from '~/composables/useVenue'
import type { VenueType } from '~/shared/types'

const { create: createCoordinates } = useCoordinates()
const { createSunny: createSunnyStatus } = useSunlightStatus()
const {
  create: createVenue,
  hasOutdoorSeating,
  isSunny: isVenueSunny,
  withSunlightStatus
} = useVenue()

describe('Venue Model', () => {
  const validVenueProps = {
    id: '1',
    name: 'Test Bar',
    type: 'bar' as VenueType,
    coordinates: createCoordinates(40.4168, -3.7038)
  }

  describe('createVenue', () => {
    it('should create venue with valid props', () => {
      const venue = createVenue(validVenueProps)
      expect(venue.id).toBe('1')
      expect(venue.name).toBe('Test Bar')
      expect(venue.type).toBe('bar')
    })

    it('should throw error if id is missing', () => {
      expect(() => createVenue({ ...validVenueProps, id: '' })).toThrow(
        'Venue must have an id'
      )
    })

    it('should throw error if name is missing', () => {
      expect(() => createVenue({ ...validVenueProps, name: '' })).toThrow(
        'Venue must have a name'
      )
    })

    it('should accept optional fields', () => {
      const venue = createVenue({
        ...validVenueProps,
        address: '123 Main St',
        outdoor_seating: true,
        rating: 4.5
      })
      expect(venue.address).toBe('123 Main St')
      expect(venue.outdoor_seating).toBe(true)
      expect(venue.rating).toBe(4.5)
    })
  })

  describe('isVenueSunny', () => {
    it('should return true if venue has sunny status', () => {
      const venue = createVenue({
        ...validVenueProps,
        sunlightStatus: createSunnyStatus()
      })
      expect(isVenueSunny(venue)).toBe(true)
    })

    it('should return false if venue has no sunlight status', () => {
      const venue = createVenue(validVenueProps)
      expect(isVenueSunny(venue)).toBe(false)
    })
  })

  describe('hasOutdoorSeating', () => {
    it('should return true if venue has outdoor seating', () => {
      const venue = createVenue({ ...validVenueProps, outdoor_seating: true })
      expect(hasOutdoorSeating(venue)).toBe(true)
    })

    it('should return false if venue has no outdoor seating', () => {
      const venue = createVenue(validVenueProps)
      expect(hasOutdoorSeating(venue)).toBe(false)
    })
  })

  describe('withSunlightStatus', () => {
    it('should return new venue with updated sunlight status', () => {
      const venue = createVenue(validVenueProps)
      const status = createSunnyStatus()
      const updated = withSunlightStatus(venue, status)

      expect(updated.sunlightStatus).toBe(status)
      expect(updated).not.toBe(venue)
      expect(updated.id).toBe(venue.id)
    })
  })
})
