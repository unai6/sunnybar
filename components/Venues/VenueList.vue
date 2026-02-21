<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { useVenue } from '~/composables/useVenue'
import type { Venue, VenueType } from '~/shared/types'

interface Props {
  venues: Venue[]
  selectedVenueId: string | null
  loading: boolean
}

defineProps<Props>()

defineEmits<{
  'venue-select': [venue: Venue]
}>()

const { isSunny } = useVenue()

function getVenueIcon(type: VenueType): string {
  const icons: Record<string, string> = {
    bar: 'pi pi-star',
    restaurant: 'pi pi-bookmark',
    cafe: 'pi pi-heart',
    pub: 'pi pi-star-fill',
    biergarten: 'pi pi-sun'
  }
  return icons[type] || 'pi pi-map-marker'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-between items-center p-4 border-b border-gray-200">
      <h3 class="text-base font-semibold text-gray-800 m-0">
        {{ $t('venueList.title.nearbyVenues') }}
      </h3>
      <span class="text-sm text-gray-500">
        {{ venues.length }} {{ $t('venueList.label.found') }}
      </span>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center p-8 gap-2 flex-1">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="venues.length === 0" class="flex flex-col items-center justify-center p-8 gap-2 flex-1">
      <i class="pi pi-search text-3xl text-gray-300" />
      <p class="m-0 text-gray-500">{{ $t('venueList.message.noVenuesFound') }}</p>
      <p class="text-sm text-gray-400">{{ $t('venueList.message.tryDifferentArea') }}</p>
    </div>

    <div v-else class="flex-1 overflow-y-auto">
      <div
        v-for="venue in venues"
        :key="venue.id"
        :class="[
          'flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors duration-150',
          venue.id === selectedVenueId ? 'bg-amber-100' : 'hover:bg-gray-50',
          isSunny(venue) ? 'border-l-[3px] border-l-amber-400' : ''
        ]"
        @click="$emit('venue-select', venue)"
      >
        <div
          :class="[
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isSunny(venue) ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
          ]"
        >
          <i :class="getVenueIcon(venue.type)" />
        </div>

        <div class="flex-1 min-w-0 flex flex-col gap-1">
          <h4 class="text-sm font-medium text-gray-800 m-0 truncate">
            {{ venue.name }}
          </h4>
          <span class="text-xs text-gray-500">
            {{ $t(`venueType.label.${venue.type}`) }}
          </span>
          <div class="flex flex-wrap gap-2 mt-1">
            <span
              v-if="venue.outdoor_seating"
              class="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded"
            >
              <i class="pi pi-external-link" />
              {{ $t('venueList.label.outdoor') }}
            </span>
            <div class="shrink-0">
              <Tag :severity="isSunny(venue) ? 'info' : 'secondary'">
                <template #default>
                  <i :class="[isSunny(venue) ? 'pi pi-sun' : 'pi pi-cloud', 'mr-1']" />
                  {{ isSunny(venue) ? $t('venueList.status.sunny') : $t('venueList.status.shaded') }}
                </template>
              </Tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
