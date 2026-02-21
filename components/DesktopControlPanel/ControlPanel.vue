<script setup lang="ts">
import type { VenueFilters } from '~/shared/types'
import type { SunInfo } from '~/stores/sunInfo'

type Props = {
  loading: boolean
  venuesCount: number
  sunnyCount: number
  shadedCount: number
  sunInfo: SunInfo | null
  selectedDateTime: Date
  filters: VenueFilters
  hideSearchSection?: boolean
}

defineProps<Props>()

defineEmits<{
  search: []
  'update-datetime': [datetime: Date]
  'update-filters': [filters: Partial<VenueFilters>]
  'locate-me': []
}>()
</script>

<template>
  <div class="p-4 md:p-3">
    <SearchSection
      v-if="!hideSearchSection"
      :loading="loading"
      @search="$emit('search')"
      @locate-me="$emit('locate-me')"
    />

    <DateTimeSelector
      :selected-date-time="selectedDateTime"
      @update-datetime="$emit('update-datetime', $event)"
    />

    <SunInfoDisplay :sun-info="sunInfo" />

    <VenueFiltersComponent
      :filters="filters"
      @update-filters="$emit('update-filters', $event)"
    />

    <VenueStats
      :venues-count="venuesCount"
      :sunny-count="sunnyCount"
      :shaded-count="shadedCount"
    />

    <!-- Version -->
    <div class="text-center mt-2">
      <span class="text-xs text-gray-400">v1.0.0</span>
    </div>
  </div>
</template>
