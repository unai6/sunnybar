<script setup lang="ts">
import Popover from 'primevue/popover'

const legendPanel = ref<InstanceType<typeof Popover> | null>(null)

function toggleLegend(event: Event): void {
  legendPanel.value?.toggle(event)
}
</script>

<template>
  <!-- Mobile: Compact version with info icon -->
  <div class="lg:hidden absolute bottom-20 left-3 z-[100]">
    <button
      class="bg-white rounded-xl px-4 py-3 shadow-lg text-sm font-bold text-slate-800 flex items-center gap-2"
      @click="toggleLegend"
    >
      <span>☀️ {{ $t('map.title.legend') }}</span>
      <i class="pi pi-info-circle text-blue-500" />
    </button>

    <Popover ref="legendPanel" class="w-64">
      <div class="space-y-3">
        <div class="font-bold text-slate-800 text-sm border-b pb-2">☀️ {{ $t('map.title.legend') }}</div>

        <div class="flex items-center gap-2.5">
          <span class="w-4 h-4 rounded-full bg-amber-400 border-[2.5px] border-white shadow-[0_0_0_1px_#d97706,0_2px_6px_rgba(255,193,7,0.4)]" />
          <span class="text-gray-700 font-medium text-xs">{{ $t('map.label.sunny') }}</span>
        </div>

        <div class="flex items-center gap-2.5">
          <span class="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-[0_0_0_1px_#4b5563]" />
          <span class="text-gray-700 font-medium text-xs">{{ $t('map.label.shaded') }}</span>
        </div>

        <div class="border-t border-gray-200 pt-3 space-y-2">
          <div class="flex items-center gap-2.5">
            <i class="pi pi-sun text-amber-500 text-sm w-4 text-center" />
            <span class="text-gray-700 font-medium text-xs">{{ $t('controlPanel.filter.onlySunnyVenues') }}</span>
          </div>
          <div class="flex items-center gap-2.5">
            <i class="pi pi-table text-gray-600 text-sm w-4 text-center" />
            <span class="text-gray-700 font-medium text-xs">{{ $t('controlPanel.filter.onlyOutdoorSeating') }}</span>
          </div>
        </div>
      </div>
    </Popover>
  </div>

  <!-- Desktop: Full legend always visible -->
  <div class="hidden lg:block absolute bottom-6 left-3 z-[100] bg-white rounded-xl px-4 py-3.5 shadow-lg text-sm">
    <div class="font-bold text-slate-800 mb-3 text-sm">☀️ {{ $t('map.title.legend') }}</div>
    
    <div class="flex items-center gap-2.5 mb-2">
      <span class="w-4 h-4 rounded-full bg-amber-400 border-[2.5px] border-white shadow-[0_0_0_1px_#d97706,0_2px_6px_rgba(255,193,7,0.4)]" />
      <span class="text-gray-700 font-medium text-xs">{{ $t('map.label.sunny') }}</span>
    </div>
    
    <div class="flex items-center gap-2.5">
      <span class="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-[0_0_0_1px_#4b5563]" />
      <span class="text-gray-700 font-medium text-xs">{{ $t('map.label.shaded') }}</span>
    </div>
  </div>
</template>
