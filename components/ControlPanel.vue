<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import type { GetSunInfoResult } from '~/application/use-cases/GetSunInfoUseCase'
import type { VenueFilters } from '~/composables/useVenues'

interface Props {
  loading: boolean
  venuesCount: number
  sunnyCount: number
  shadedCount: number
  sunInfo: GetSunInfoResult | null
  selectedDateTime: Date
  filters: VenueFilters
}

const props = defineProps<Props>()

const emit = defineEmits<{
  search: []
  'update-datetime': [datetime: Date]
  'update-filters': [filters: Partial<VenueFilters>]
  'locate-me': []
}>()

// Local state
const localDateTime = ref(props.selectedDateTime)
const localFilters = ref({ ...props.filters })

// Watch for prop changes
watch(() => props.selectedDateTime, (newVal) => {
  localDateTime.value = newVal
})

watch(() => props.filters, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })

// Methods
const handleDateTimeChange = (value: Date | null): void => {
  if (value) {
    emit('update-datetime', value)
  }
}

const adjustTime = (hours: number): void => {
  const newDate = new Date(localDateTime.value)
  newDate.setHours(newDate.getHours() + hours)
  localDateTime.value = newDate
  emit('update-datetime', newDate)
}

const setToNow = (): void => {
  const now = new Date()
  localDateTime.value = now
  emit('update-datetime', now)
}

const emitFilters = (): void => {
  emit('update-filters', localFilters.value)
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="p-4">
    <!-- Search Section -->
    <div class="mb-6">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        <i class="pi pi-search text-gray-500" />
        {{ $t('controlPanel.title.searchArea') }}
      </h3>
      <Button
        :label="$t('controlPanel.button.searchThisArea')"
        icon="pi pi-refresh"
        :loading="loading"
        class="w-full"
        severity="warning"
        @click="$emit('search')"
      />
      <Button
        :label="$t('controlPanel.button.useMyLocation')"
        icon="pi pi-map-marker"
        class="w-full mt-2"
        severity="secondary"
        outlined
        @click="$emit('locate-me')"
      />
    </div>

    <!-- Date/Time Section -->
    <div class="mb-6">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        <i class="pi pi-clock text-gray-500" />
        {{ $t('controlPanel.title.dateTime') }}
      </h3>
      <div class="flex flex-col gap-2">
        <Calendar
          v-model="localDateTime"
          :show-time="true"
          hour-format="24"
          :show-icon="true"
          :show-button-bar="true"
          date-format="dd/mm/yy"
          class="w-full"
          @update:model-value="handleDateTimeChange"
        />
        <div class="flex justify-center gap-2">
          <Button
            v-tooltip="$t('controlPanel.label.minusOneHour')"
            icon="pi pi-minus"
            severity="secondary"
            text
            rounded
            @click="adjustTime(-1)"
          />
          <Button
            :label="$t('controlPanel.button.now')"
            severity="secondary"
            text
            size="small"
            @click="setToNow"
          />
          <Button
            v-tooltip="$t('controlPanel.label.plusOneHour')"
            icon="pi pi-plus"
            severity="secondary"
            text
            rounded
            @click="adjustTime(1)"
          />
        </div>
      </div>
    </div>

    <!-- Sun Info Section -->
    <div v-if="sunInfo" class="mb-6">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        <i :class="['pi pi-sun', sunInfo.isDaytime ? 'text-amber-500' : 'text-gray-500']" />
        {{ $t('controlPanel.title.sunPosition') }}
      </h3>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.altitude') }}</span>
          <span class="text-base font-semibold text-gray-800">{{ sunInfo.position.altitudeDegrees.toFixed(1) }}°</span>
        </div>
        <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.azimuth') }}</span>
          <span class="text-base font-semibold text-gray-800">{{ sunInfo.position.azimuthDegrees.toFixed(1) }}°</span>
        </div>
        <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunrise') }}</span>
          <span class="text-base font-semibold text-gray-800">{{ formatTime(sunInfo.times.sunrise) }}</span>
        </div>
        <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunset') }}</span>
          <span class="text-base font-semibold text-gray-800">{{ formatTime(sunInfo.times.sunset) }}</span>
        </div>
      </div>
      <Tag
        v-if="!sunInfo.isDaytime"
        severity="secondary"
        class="w-full mt-2 justify-center"
      >
        <i class="pi pi-moon mr-2" />
        {{ $t('controlPanel.message.nighttime') }}
      </Tag>
    </div>

    <!-- Filters Section -->
    <div class="mb-6">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        <i class="pi pi-filter text-gray-500" />
        {{ $t('controlPanel.title.filters') }}
      </h3>
      <div class="flex flex-col gap-3">
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

    <!-- Stats Section -->
    <div class="mb-6">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
        <i class="pi pi-chart-bar text-gray-500" />
        {{ $t('controlPanel.title.results') }}
      </h3>
      <div class="grid grid-cols-3 gap-2">
        <div class="flex flex-col items-center py-3 px-2 rounded-lg bg-gray-50">
          <span class="text-2xl font-bold text-gray-700">{{ venuesCount }}</span>
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.total') }}</span>
        </div>
        <div class="flex flex-col items-center py-3 px-2 rounded-lg bg-amber-100">
          <span class="text-2xl font-bold text-amber-600">{{ sunnyCount }}</span>
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunny') }}</span>
        </div>
        <div class="flex flex-col items-center py-3 px-2 rounded-lg bg-gray-100">
          <span class="text-2xl font-bold text-gray-500">{{ shadedCount }}</span>
          <span class="text-xs text-gray-500">{{ $t('controlPanel.label.shaded') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
