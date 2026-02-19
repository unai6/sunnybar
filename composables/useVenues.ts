import { storeToRefs } from "pinia";
import { Venue, VenueType } from "~/domain/entities/Venue";
import type { BoundingBox } from "~/domain/repositories/VenueRepository";
import { Coordinates } from "~/domain/value-objects/Coordinates";
import { SunlightStatus } from "~/domain/value-objects/SunlightStatus";
import type { VenueFilters } from "~/stores/venues";
import { useVenuesStore } from "~/stores/venues";

interface ApiVenue {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  outdoor_seating?: boolean;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  priceRange?: string;
  description?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  sunlightStatus?: "sunny" | "shaded" | "partially_sunny";
}

interface ApiResponse {
  venues: ApiVenue[];
  sunPosition: {
    azimuth: number;
    altitude: number;
    isDaytime: boolean;
  };
  meta: {
    timestamp: string;
    buildingsAnalyzed: number;
    venueCount: number;
  };
}

/**
 * Convert API venue response to domain Venue entity
 * Stores i18n keys as reason — translated at the view layer via $t()
 */
function apiVenueToDomain(apiVenue: ApiVenue): Venue {
  const coordinates = Coordinates.create({
    latitude: apiVenue.latitude,
    longitude: apiVenue.longitude,
  });

  let sunlightStatus: SunlightStatus | undefined;
  if (apiVenue.sunlightStatus) {
    switch (apiVenue.sunlightStatus) {
      case "sunny":
        sunlightStatus = SunlightStatus.sunny(
          1,
          "sunlight.description.directSunlight",
        );
        break;
      case "shaded":
        sunlightStatus = SunlightStatus.shaded(
          1,
          "sunlight.description.inBuildingShadow",
        );
        break;
      case "partially_sunny":
        sunlightStatus = SunlightStatus.partiallySunny(
          0.7,
          "sunlight.description.partialShadow",
        );
        break;
    }
  }

  return Venue.create({
    id: apiVenue.id,
    name: apiVenue.name,
    type: (apiVenue.type as VenueType) || VenueType.BAR,
    coordinates,
    address: apiVenue.address,
    outdoor_seating: apiVenue.outdoor_seating,
    phone: apiVenue.phone,
    website: apiVenue.website,
    openingHours: apiVenue.openingHours,
    rating: apiVenue.rating,
    priceRange: apiVenue.priceRange,
    description: apiVenue.description,
    socialMedia: apiVenue.socialMedia,
    sunlightStatus,
  });
}

const MAX_BBOX_DEGREES = 0.05;

export enum VenueErrorCode {
  BBOX_TOO_LARGE = "bbox-too-large",
  NETWORK = "network",
  FETCH_FAILED = "fetch-failed",
}

function isBboxTooLarge(bbox: BoundingBox): boolean {
  return (
    bbox.north - bbox.south > MAX_BBOX_DEGREES ||
    bbox.east - bbox.west > MAX_BBOX_DEGREES
  );
}

function classifyFetchError(e: Error): VenueErrorCode {
  const err = e as Error & {
    statusCode?: number;
    data?: { statusMessage?: string };
  };
  const statusMessage = err.data?.statusMessage || "";

  if (statusMessage.includes("Bounding box too large"))
    return VenueErrorCode.BBOX_TOO_LARGE;
  if (err.statusCode === 0 || e.message === "Failed to fetch")
    return VenueErrorCode.NETWORK;
  return VenueErrorCode.FETCH_FAILED;
}

export function useVenues() {
  // Use Pinia store for framework-agnostic state management
  const store = useVenuesStore();

  const {
    venues,
    loading,
    error,
    lastBbox,
    filters,
    sunnyVenues,
    shadedVenues,
    filteredVenues,
  } = storeToRefs(store);

  // Actions
  async function fetchVenuesByBoundingBox(
    bbox: BoundingBox,
    datetime?: Date,
  ): Promise<VenueErrorCode | null> {
    if (isBboxTooLarge(bbox)) {
      store.setError(VenueErrorCode.BBOX_TOO_LARGE);
      return VenueErrorCode.BBOX_TOO_LARGE;
    }

    store.setLoading(true);
    store.setError(null);

    const { data, error: fetchError } = await attempt(async () => {
      const params = new URLSearchParams({
        south: bbox.south.toString(),
        west: bbox.west.toString(),
        north: bbox.north.toString(),
        east: bbox.east.toString(),
        ...(datetime && { datetime: datetime.toISOString() }),
      });

      return $fetch<ApiResponse>(`/api/venues?${params}`);
    });

    if (fetchError) {
      const errorCode = classifyFetchError(fetchError);
      store.setError(errorCode);
      store.setVenues([]);
      store.setLoading(false);
      return errorCode;
    }

    store.setVenues(data.venues.map(apiVenueToDomain));
    store.setLastBbox(bbox);
    store.setLoading(false);
    return null;
  }

  function setFilters(newFilters: Partial<VenueFilters>): void {
    store.setFilters(newFilters);
  }

  return {
    // State
    venues,
    loading,
    error,
    lastBbox,
    filters,

    // Computed
    sunnyVenues,
    shadedVenues,
    filteredVenues,

    // Actions
    fetchVenuesByBoundingBox,
    setFilters,
  };
}
