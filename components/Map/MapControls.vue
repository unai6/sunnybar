<script setup lang="ts">
import DatePicker from 'primevue/datepicker'
import { ref, watch } from 'vue'
import type { VenueFilters } from '~/shared/types'

type Props = {
  selectedDateTime: Date
  filters: VenueFilters
  sunnyCount: number
  shadedCount: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update-datetime': [datetime: Date]
  'update-filters': [filters: Partial<VenueFilters>]
}>()

const showDatePicker = ref(false)
const localDateTime = ref(props.selectedDateTime)
const localFilters = ref({ ...props.filters })

// Watch for prop changes
watch(() => props.selectedDateTime, (newVal) => {
  localDateTime.value = newVal
})

watch(() => props.filters, (newVal) => {
  localFilters.value = { ...newVal }
}, { deep: true })

function handleDateTimeChange(value: Date | Date[] | (Date | null)[] | null | undefined): void {
  if (value instanceof Date) {
    localDateTime.value = value
    emit('update-datetime', value)
    showDatePicker.value = false
  }
}

function adjustTime(hours: number): void {
  const newDate = new Date(localDateTime.value)
  newDate.setHours(newDate.getHours() + hours)
  localDateTime.value = newDate
  emit('update-datetime', newDate)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function toggleFilter(filter: 'onlySunny' | 'onlyWithOutdoorSeating'): void {
  localFilters.value[filter] = !localFilters.value[filter]
  emit('update-filters', localFilters.value)
}
</script>

<template>
  <div class="w-full">
    <!-- Compact Single Row Controls -->
    <div class="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-1.5">
      <div class="flex items-center gap-1.5">
        <!-- Time Adjust -1h -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0"
          @click="adjustTime(-1)"
        >
          <i class="pi pi-minus text-gray-600 text-xs" />
        </button>
        
        <!-- Time Display -->
        <button
          class="flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 transition-colors flex-shrink-0"
          @click="showDatePicker = !showDatePicker"
        >
          <i class="pi pi-clock text-amber-600 text-xs" />
          <span class="text-xs font-semibold text-gray-800 whitespace-nowrap">{{ formatTime(localDateTime) }}</span>
        </button>
        
        <!-- Time Adjust +1h -->
        <button
          class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors flex-shrink-0"
          @click="adjustTime(1)"
        >
          <i class="pi pi-plus text-gray-600 text-xs" />
        </button>

        <!-- Divider -->
        <div class="w-px h-6 bg-gray-300 flex-shrink-0" />

        <!-- Sunny Filter -->
        <button
          class="relative flex items-center justify-center px-2 py-1.5 rounded-lg transition-all flex-1"
          :class="localFilters.onlySunny 
            ? 'bg-amber-100 text-amber-700 border border-amber-300' 
            : 'bg-gray-50 text-gray-600 border border-gray-200'"
          @click="toggleFilter('onlySunny')"
        >
          <i class="pi pi-sun text-base" />
          <span
            class="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm"
          >
            {{ sunnyCount }}
          </span>
        </button>

        <!-- Outdoor Filter -->
        <button
          class="flex items-center justify-center px-2 py-1.5 rounded-lg transition-all flex-1"
          :class="localFilters.onlyWithOutdoorSeating 
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
            : 'bg-gray-50 text-gray-600 border border-gray-200'"
          @click="toggleFilter('onlyWithOutdoorSeating')"
        >
          <i class="pi pi-table text-base" />
        </button>
      </div>

      <!-- Inline Date Picker -->
      <div
        v-if="showDatePicker"
        class="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[300]"
      >
        <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
          <span class="text-sm font-semibold text-gray-700">{{ $t('controlPanel.title.dateTime') }}</span>
          <button
            class="flex items-center justify-center w-6 h-6 rounded-lg hover:bg-gray-200 transition-colors"
            @click="showDatePicker = false"
          >
            <i class="pi pi-times text-xs text-gray-600" />
          </button>
        </div>
        <DatePicker
          v-model="localDateTime"
          show-time
          hour-format="24"
          inline
          @update:model-value="handleDateTimeChange"
        />
      </div>
    </div>
  </div>
</template>
