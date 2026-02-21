<script setup lang="ts">
import Tag from 'primevue/tag'
import type { SunInfo } from '~/stores/sunInfo'

type Props = {
  sunInfo: SunInfo | null
}

defineProps<Props>()

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div v-if="sunInfo" class="mb-6 md:mb-4">
    <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 md:mb-2 uppercase tracking-wider">
      <i :class="['pi pi-sun', sunInfo.isDaytime ? 'text-amber-500' : 'text-gray-500']" />
      {{ $t('controlPanel.title.sunPosition') }}
    </h3>
    <div class="grid grid-cols-2 gap-3 md:gap-2">
      <div class="flex flex-col bg-gray-50 px-3 py-2 md:px-2 md:py-1.5 rounded-lg">
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.altitude') }}</span>
        <span class="text-base md:text-sm font-semibold text-gray-800">{{ sunInfo.position.altitudeDegrees.toFixed(1) }}°</span>
      </div>
      <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.azimuth') }}</span>
        <span class="text-base md:text-sm font-semibold text-gray-800">{{ sunInfo.position.azimuthDegrees.toFixed(1) }}°</span>
      </div>
      <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunrise') }}</span>
        <span class="text-base md:text-sm font-semibold text-gray-800">{{ formatTime(sunInfo.times.sunrise) }}</span>
      </div>
      <div class="flex flex-col bg-gray-50 px-3 py-2 rounded-lg">
        <span class="text-xs text-gray-500">{{ $t('controlPanel.label.sunset') }}</span>
        <span class="text-base md:text-sm font-semibold text-gray-800">{{ formatTime(sunInfo.times.sunset) }}</span>
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
</template>
