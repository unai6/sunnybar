<script setup lang="ts">
import Button from 'primevue/button'
import type { Venue } from '~/domain/entities/Venue'

interface Props {
  venue: Venue
}

const props = defineProps<Props>()

const openUrl = (url: string | undefined): void => {
  if (url) {
    globalThis.open(url, '_blank')
  }
}

const callPhone = (phone: string | undefined): void => {
  if (phone) {
    globalThis.location.href = `tel:${phone}`
  }
}

const openDirections = (): void => {
  const { latitude, longitude } = props.venue.coordinates
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
  globalThis.open(url, '_blank')
}
</script>

<template>
  <div class="p-5 flex flex-col gap-4 bg-white min-w-[350px]">
    <!-- Sunlight Status Banner -->
    <div
      :class="[
        'flex items-center gap-3.5 p-4 rounded-xl border',
        venue.isSunny()
          ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300'
          : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300'
      ]"
    >
      <div
        :class="[
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
          venue.isSunny()
            ? 'bg-amber-400/30 text-amber-700'
            : 'bg-slate-500/20 text-slate-600'
        ]"
      >
        <i :class="venue.isSunny() ? 'pi pi-sun' : 'pi pi-cloud'" />
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-lg font-bold text-slate-800">
          {{ venue.isSunny() ? $t('venueDetail.title.currentlySunny') : $t('venueDetail.title.currentlyShaded') }}
        </span>
        <span v-if="venue.sunlightStatus" class="text-sm text-slate-500">
          {{ Math.round(venue.sunlightStatus.confidence * 100) }}% {{ $t('venueDetail.label.confidence') }}
        </span>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Type -->
      <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
        <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
          {{ $t('venueDetail.label.type') }}
        </div>
        <div class="text-[15px] font-semibold text-slate-700">
          {{ $t(`venueType.label.${venue.type}`) }}
        </div>
      </div>

      <!-- Terrace -->
      <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
        <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
          {{ $t('venueDetail.label.terrace') }}
        </div>
        <div
          :class="[
            'text-[15px] font-semibold',
            venue.outdoor_seating ? 'text-emerald-600' : 'text-slate-500'
          ]"
        >
          {{ venue.outdoor_seating ? '✓ ' + $t('venueDetail.label.available') : '✗ ' + $t('venueDetail.label.no') }}
        </div>
      </div>
    </div>

    <!-- Address -->
    <div
      v-if="venue.address"
      class="p-3.5 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {{ $t('venueDetail.label.address') }}
      </div>
      <div class="text-sm font-medium text-slate-700 leading-relaxed">
        {{ venue.address }}
      </div>
    </div>

    <!-- Opening Hours -->
    <div
      v-if="venue.openingHours"
      class="p-3.5 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        Opening Hours
      </div>
      <div class="text-sm font-medium text-slate-700">
        {{ venue.openingHours }}
      </div>
    </div>

    <!-- Sun Analysis -->
    <div
      v-if="venue.sunlightStatus?.reason"
      class="flex items-start gap-2.5 p-3.5 bg-blue-50 rounded-lg border border-blue-200"
    >
      <i class="pi pi-info-circle text-blue-500 mt-0.5" />
      <span class="text-sm text-blue-800 leading-relaxed">
        {{ $t(venue.sunlightStatus.reason) }}
      </span>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pt-1">
      <Button
        v-if="venue.website"
        label="Website"
        icon="pi pi-globe"
        severity="secondary"
        outlined
        class="flex-1"
        @click="openUrl(venue.website)"
      />
      <Button
        v-if="venue.phone"
        label="Call"
        icon="pi pi-phone"
        severity="secondary"
        outlined
        class="flex-1"
        @click="callPhone(venue.phone)"
      />
      <Button
        :label="$t('venueDetail.button.getDirections')"
        icon="pi pi-compass"
        severity="warning"
        class="flex-1"
        @click="openDirections"
      />
    </div>
  </div>
</template>
