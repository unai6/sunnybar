<script setup lang="ts">
interface Props {
  venuesCount: number
  sunnyCount: number
  shadedCount: number
}

defineProps<Props>()
</script>

<template>
  <div class="mb-6 md:mb-4">
    <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 md:mb-2 uppercase tracking-wider">
      <i class="pi pi-chart-bar text-gray-500" />
      {{ $t('controlPanel.title.results') }}
    </h3>
    <div class="grid grid-cols-3 gap-2">
      <div class="flex flex-col items-center py-3 px-2 md:py-2 md:px-1 rounded-lg bg-gray-50">
        <span class="text-2xl md:text-xl font-bold text-gray-700">{{ venuesCount }}</span>
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.total') }}</span>
      </div>
      <div class="flex flex-col items-center py-3 px-2 md:py-2 md:px-1 rounded-lg bg-amber-100">
        <span class="text-2xl md:text-xl font-bold text-amber-600">{{ sunnyCount }}</span>
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunny') }}</span>
      </div>
      <div class="flex flex-col items-center py-3 px-2 md:py-2 md:px-1 rounded-lg bg-gray-100">
        <span class="text-2xl md:text-xl font-bold text-gray-500">{{ shadedCount }}</span>
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.shaded') }}</span>
      </div>
    </div>
  </div>
</template>
