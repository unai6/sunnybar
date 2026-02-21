<script setup lang="ts">
import AutoComplete from 'primevue/autocomplete'

interface SearchResult {
  id: number
  name: string
  latitude: number
  longitude: number
  bounds: {
    south: number
    north: number
    west: number
    east: number
  }
  type: string
}

const emit = defineEmits<{
  'place-selected': [result: SearchResult]
}>()

const { searchPlace, searchResults, isSearching } = useNominatimSearch()

const searchQuery = ref('')
const selectedPlace = ref<SearchResult | null>(null)
const showResults = ref(false)

// Debounced search
let searchTimeout: NodeJS.Timeout | null = null

function handleSearch(event: { query: string }): void {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(async () => {
    await searchPlace(event.query)
    showResults.value = true
  }, 500)
}

function handleSelect(event: { value: SearchResult }): void {
  selectedPlace.value = event.value
  showResults.value = false
  emit('place-selected', event.value)
}

function handleClear(): void {
  searchQuery.value = ''
  selectedPlace.value = null
  showResults.value = false
}
</script>

<template>
  <div class="w-full">
    <AutoComplete
      v-model="selectedPlace"
      :suggestions="searchResults"
      option-label="name"
      :placeholder="$t('map.search.placeholder')"
      :loading="isSearching"
      :min-length="2"
      append-to="self"
      fluid
      input-class="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 shadow-sm focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 focus:outline-none"
      panel-class="!w-full mt-2 rounded-xl shadow-lg border-0 overflow-hidden"
      @complete="handleSearch"
      @item-select="handleSelect"
      @clear="handleClear"
    >
      <template #option="slotProps">
        <div class="flex items-start gap-2 py-2 px-3">
          <i class="pi pi-map-marker text-amber-600 mt-1 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-gray-900 truncate">
              {{ slotProps.option.name.split(',')[0] }}
            </div>
            <div class="text-xs text-gray-500 truncate">
              {{ slotProps.option.name.split(',').slice(1).join(',') }}
            </div>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="p-3 text-sm text-gray-500 text-center">
          {{ $t('map.search.noResults') }}
        </div>
      </template>
    </AutoComplete>
  </div>
</template>

<style scoped>
:deep(.p-autocomplete-option:hover) {
  background-color: #fef3c7;
}
</style>
