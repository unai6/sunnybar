<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import type { VenueErrorCode } from '~/composables/useVenues'

const toast = useToast()
const { t } = useI18n()

// Mobile menu state
const mobileMenuOpen = ref(false)
const mobileTab = ref<'controls' | 'venues'>('controls')

const TOAST_DURATION_MS = 5000

const ERROR_TOAST_MAP: Record<VenueErrorCode, { severity: 'error' | 'warn'; key: string }> = {
  'bbox-too-large': { severity: 'warn', key: 'toast.error.bboxTooLarge' },
  'network': { severity: 'error', key: 'toast.error.network' },
  'fetch-failed': { severity: 'error', key: 'toast.error.fetchVenues' }
}

const {
  loading,
  filters,
  sunnyVenues,
  shadedVenues,
  filteredVenues,
  sunInfo,
  selectedDateTime,
  mapRef,
  mapCenter,
  mapZoom,
  selectedVenueId,
  selectedVenue,
  showVenueDetail,
  handleSearch: search,
  handleBoundsChanged,
  handleDateTimeUpdate: updateDateTime,
  handleFilterUpdate: updateFilters,
  handleVenueClick,
  handleVenueSelect,
  handleLocateMe
} = useMapExplorer()

function showVenueError(errorCode: VenueErrorCode): void {
  const { severity, key } = ERROR_TOAST_MAP[errorCode]
  toast.add({
    severity,
    summary: t('toast.error.title'),
    detail: t(key),
    life: TOAST_DURATION_MS
  })
}

async function handleSearch(): Promise<void> {
  const errorCode = await search()
  if (errorCode) showVenueError(errorCode)
}

async function handleDateTimeUpdate(datetime: Date): Promise<void> {
  const errorCode = await updateDateTime(datetime)
  if (errorCode) showVenueError(errorCode)
}

async function handleFilterUpdate(newFilters: Parameters<typeof updateFilters>[0]): Promise<void> {
  const errorCode = await updateFilters(newFilters)
  if (errorCode) showVenueError(errorCode)
}

async function onLocateMe(): Promise<void> {
  const { error } = await attempt(() => handleLocateMe())
  if (error) {
    console.error('Geolocation error:', error)
    toast.add({
      severity: 'error',
      summary: t('toast.error.title'),
      detail: t('toast.error.geolocation'),
      life: TOAST_DURATION_MS
    })
  }
}
</script>

<template>
  <div class="relative h-full">
    <!-- Mobile Burger Button -->
    <button
      class="md:hidden fixed top-4 right-4 z-[300] flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 text-gray-700 text-xl cursor-pointer transition-colors duration-200 hover:bg-gray-100"
      :aria-label="$t('header.button.menu')"
      @click="mobileMenuOpen = true"
    >
      <i class="pi pi-bars" />
    </button>

    <!-- Mobile Slide-out Drawer -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mobileMenuOpen"
          class="md:hidden fixed inset-0 bg-black/40 z-[400]"
          @click="mobileMenuOpen = false"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="mobileMenuOpen"
          class="md:hidden fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.15)] z-[500] flex flex-col overflow-hidden"
        >
          <!-- Drawer Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-sun text-xl text-amber-500" />
              <span class="text-xl font-bold bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">
                SunBar
              </span>
            </div>
            <div class="flex items-center gap-2">
              <LocaleSwitcher />
              <button
                class="flex items-center justify-center w-9 h-9 border-none rounded-lg bg-gray-100 text-gray-500 cursor-pointer transition-colors duration-200 hover:bg-gray-200"
                @click="mobileMenuOpen = false"
              >
                <i class="pi pi-times" />
              </button>
            </div>
          </div>

          <!-- Drawer Content: Tabs for Controls & Venues -->
          <div class="flex border-b border-gray-200 shrink-0">
            <button
              :class="[
                'flex-1 py-3 text-sm font-semibold text-center cursor-pointer border-none transition-colors duration-200',
                mobileTab === 'controls' ? 'text-amber-600 bg-amber-50 border-b-2 border-b-amber-500' : 'text-gray-500 bg-white hover:bg-gray-50'
              ]"
              @click="mobileTab = 'controls'"
            >
              <i class="pi pi-sliders-h mr-1" />
              {{ $t('controlPanel.title.searchArea') }}
            </button>
            <button
              :class="[
                'flex-1 py-3 text-sm font-semibold text-center cursor-pointer border-none transition-colors duration-200',
                mobileTab === 'venues' ? 'text-amber-600 bg-amber-50 border-b-2 border-b-amber-500' : 'text-gray-500 bg-white hover:bg-gray-50'
              ]"
              @click="mobileTab = 'venues'"
            >
              <i class="pi pi-list mr-1" />
              {{ $t('venueList.title.nearbyVenues') }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="flex-1 overflow-y-auto">
            <ControlPanel
              v-show="mobileTab === 'controls'"
              :loading="loading"
              :venues-count="filteredVenues.length"
              :sunny-count="sunnyVenues.length"
              :shaded-count="shadedVenues.length"
              :sun-info="sunInfo"
              :selected-date-time="selectedDateTime"
              :filters="filters"
              @search="() => { handleSearch(); mobileMenuOpen = false }"
              @update-datetime="handleDateTimeUpdate"
              @update-filters="handleFilterUpdate"
              @locate-me="() => { onLocateMe(); mobileMenuOpen = false }"
            />
            <VenueList
              v-show="mobileTab === 'venues'"
              :venues="filteredVenues"
              :selected-venue-id="selectedVenueId"
              :loading="loading"
              @venue-select="(v) => { handleVenueSelect(v); mobileMenuOpen = false }"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Desktop Layout -->
    <div class="h-full md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr_300px] gap-0">
      <!-- Control Panel (desktop only) -->
      <aside class="hidden md:block border-r border-gray-200 overflow-y-auto" aria-label="Search controls">
        <ControlPanel
          :loading="loading"
          :venues-count="filteredVenues.length"
          :sunny-count="sunnyVenues.length"
          :shaded-count="shadedVenues.length"
          :sun-info="sunInfo"
          :selected-date-time="selectedDateTime"
          :filters="filters"
          @search="handleSearch"
          @update-datetime="handleDateTimeUpdate"
          @update-filters="handleFilterUpdate"
          @locate-me="onLocateMe"
        />
      </aside>

      <!-- Map (always rendered, single instance) -->
      <div class="relative h-full">
        <div v-if="loading" class="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <ProgressSpinner />
        </div>

        <ArcGISMap
          ref="mapRef"
          :venues="filteredVenues"
          :center="mapCenter"
          :zoom="mapZoom"
          :selected-date-time="selectedDateTime"
          @bounds-changed="handleBoundsChanged"
          @venue-click="handleVenueClick"
        />
      </div>

      <!-- Venue List Sidebar (desktop only) -->
      <aside class="hidden lg:block border-l border-gray-200 overflow-y-auto" aria-label="Venue results">
        <VenueList
          :venues="filteredVenues"
          :selected-venue-id="selectedVenueId"
          :loading="loading"
          @venue-select="handleVenueSelect"
        />
      </aside>
    </div>

    <!-- Venue Detail Dialog -->
    <Dialog
      v-model:visible="showVenueDetail"
      :header="selectedVenue?.name || $t('venueDetail.title.venueDetails')"
      :modal="true"
      :dismissable-mask="true"
      :closable="true"
      :draggable="false"
      class="venue-dialog"
    >
      <VenueDetail v-if="selectedVenue" :venue="selectedVenue" />
    </Dialog>
  </div>
</template>
