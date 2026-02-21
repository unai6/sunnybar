<script setup lang="ts">
import Drawer from 'primevue/drawer'
import type { Venue } from '~/shared/types'

type Props = {
  visible: boolean
  venues: Venue[]
  selectedVenueId: string | null
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'venue-select': [venue: Venue]
}>()

function handleVenueSelect(venue: Venue): void {
  emit('venue-select', venue)
  emit('update:visible', false)
}
</script>

<template>
  <Drawer
    :visible="visible"
    position="bottom"
    class="lg:hidden !h-full"
    :show-close-icon="false"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-lg font-semibold flex items-center gap-2">
          <i class="pi pi-list text-amber-500" />
          {{ $t('venueList.title.nearbyVenues') }}
          <span class="text-sm text-gray-500">({{ venues.length }})</span>
        </h2>
        <button
          class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          @click="emit('update:visible', false)"
        >
          <i class="pi pi-times" />
        </button>
      </div>
    </template>
    <VenueList
      :venues="venues"
      :selected-venue-id="selectedVenueId"
      :loading="loading"
      @venue-select="handleVenueSelect"
    />
  </Drawer>
</template>
