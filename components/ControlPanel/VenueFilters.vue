<script setup lang="ts">
import Checkbox from 'primevue/checkbox'
import { ref, watch } from 'vue'
import type { VenueFilters } from '~/shared/types'

interface Props {
  filters: VenueFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-filters': [filters: Partial<VenueFilters>]
}>()

const localFilters = ref({ ...props.filters })

watch(() => props.filters, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })

function emitFilters(): void {
  emit('update-filters', localFilters.value)
}
</script>

<template>
  <div class="mb-6 md:mb-4">
    <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 md:mb-2 uppercase tracking-wider">
      <i class="pi pi-filter text-gray-500" />
      {{ $t('controlPanel.title.filters') }}
    </h3>
    <div class="flex flex-col gap-3 md:gap-2">
      <div class="flex items-center gap-2">
        <Checkbox
          v-model="localFilters.onlySunny"
          :binary="true"
          input-id="filter-sunny"
          @update:model-value="emitFilters"
        />
        <label for="filter-sunny" class="flex items-center gap-2 text-sm cursor-pointer">
          <i class="pi pi-sun text-amber-500" />
          {{ $t('controlPanel.filter.onlySunnyVenues') }}
        </label>
      </div>
      <div class="flex items-center gap-2">
        <Checkbox
          v-model="localFilters.onlyWithOutdoorSeating"
          :binary="true"
          input-id="filter-outdoor"
          @update:model-value="emitFilters"
        />
        <label for="filter-outdoor" class="flex items-center gap-2 text-sm cursor-pointer">
          <i class="pi pi-table text-gray-500" />
          {{ $t('controlPanel.filter.onlyOutdoorSeating') }}
        </label>
      </div>
    </div>
  </div>
</template>
