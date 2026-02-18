<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Venue } from '~/domain/entities/Venue'

const { t } = useI18n()

interface Props {
  venues: Venue[]
  center: [number, number]
  zoom: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'bounds-changed': [bounds: { south: number; west: number; north: number; east: number }]
  'venue-click': [venue: Venue]
}>()

// Refs
const mapContainer = ref<HTMLElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let map: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const markers: globalThis.Map<string, any> = new globalThis.Map()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const glowCircles: globalThis.Map<string, any> = new globalThis.Map()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let L: any = null

// Expose methods
defineExpose({
  flyTo: (lat: number, lng: number, zoom?: number) => {
    if (map) map.flyTo([lat, lng], zoom || map.getZoom())
  },
  closePopups: () => {
    if (map) map.closePopup()
  }
})

const emitBounds = (): void => {
  if (!map) return
  const bounds = map.getBounds()
  emit('bounds-changed', {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  })
}

type SunlightType = 'sunny' | 'partial' | 'shaded'

interface MarkerStyle {
  fillColor: string
  strokeColor: string
  glowColor: string
  radius: number
  weight: number
  fillOpacity: number
  className: string
  glowClassName: string
}

const MARKER_STYLES: Record<SunlightType, MarkerStyle> = {
  sunny: {
    fillColor: '#fbbf24',
    strokeColor: '#f59e0b',
    glowColor: 'rgba(251, 191, 36, 0.3)',
    radius: 12,
    weight: 3,
    fillOpacity: 0.95,
    className: 'sunny-marker-element',
    glowClassName: 'sunny-glow pulse-animation'
  },
  partial: {
    fillColor: '#fdba74',
    strokeColor: '#fb923c',
    glowColor: 'rgba(253, 186, 116, 0.25)',
    radius: 12,
    weight: 3,
    fillOpacity: 0.95,
    className: '',
    glowClassName: 'partial-glow'
  },
  shaded: {
    fillColor: '#64748b',
    strokeColor: '#475569',
    glowColor: 'rgba(100, 116, 139, 0.2)',
    radius: 8,
    weight: 2,
    fillOpacity: 0.7,
    className: '',
    glowClassName: ''
  }
}

const getSunlightType = (venue: Venue): SunlightType => {
  const isSunny = venue.isSunny()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isPartial = (venue.sunlightStatus as any)?.value === 'partially_sunny'
  if (isSunny && !isPartial) return 'sunny'
  if (isPartial) return 'partial'
  return 'shaded'
}

const addGlowCircle = (venue: Venue, style: MarkerStyle): void => {
  if (!L || !map || !style.glowClassName) return
  const glowCircle = L.circle(
    [venue.coordinates.latitude, venue.coordinates.longitude],
    {
      radius: 15,
      fillColor: style.glowColor,
      color: 'transparent',
      fillOpacity: 0.8,
      className: style.glowClassName
    }
  )
  glowCircle.addTo(map)
  glowCircles.set(venue.id, glowCircle)
}

const getVenueTypeLabel = (type: string): string => t(`venueType.label.${type}`)

const buildPopupContent = (venue: Venue, sunlightType: SunlightType): string => {
  const labels: Record<SunlightType, { emoji: string; text: string }> = {
    sunny: { emoji: '☀️', text: t('map.label.sunny') },
    partial: { emoji: '⛅', text: t('map.label.partiallySunny') },
    shaded: { emoji: '🌥️', text: t('map.label.shaded') }
  }
  const label = labels[sunlightType]
  const sunlightText = venue.sunlightStatus
    ? `<span class="status ${sunlightType}">
        <span style="font-size: 1.2em;">${label.emoji}</span>
        ${label.text}
       </span>`
    : ''

  return `
    <div class="venue-popup">
      <h3>${venue.name}</h3>
      <p style="color: #6b7280; font-size: 0.85rem; margin-bottom: 8px;">
        ${getVenueTypeLabel(venue.type)}
        ${venue.outdoor_seating ? ` • ${t('map.message.outdoorSeating')}` : ''}
      </p>
      ${sunlightText}
      ${venue.address ? `<p style="margin-top: 8px; font-size: 0.85rem;">${venue.address}</p>` : ''}
    </div>
  `
}

const createMarker = (venue: Venue): any => {
  if (!L || !map) return null

  const sunlightType = getSunlightType(venue)
  const style = MARKER_STYLES[sunlightType]

  if (sunlightType !== 'shaded') addGlowCircle(venue, style)

  const marker = L.circleMarker(
    [venue.coordinates.latitude, venue.coordinates.longitude],
    {
      radius: style.radius,
      fillColor: style.fillColor,
      color: style.strokeColor,
      weight: style.weight,
      opacity: 1,
      fillOpacity: style.fillOpacity,
      className: style.className
    }
  )

  marker.bindPopup(buildPopupContent(venue, sunlightType), { autoClose: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marker.on('click', (e: any) => {
    e.target.closePopup()
    emit('venue-click', venue)
  })

  return marker
}

const updateMarkers = (): void => {
  if (!map || !L) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  markers.forEach((marker: any) => marker.remove())
  markers.clear()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  glowCircles.forEach((circle: any) => circle.remove())
  glowCircles.clear()

  props.venues.forEach(venue => {
    const marker = createMarker(venue)
    if (marker) {
      marker.addTo(map!)
      markers.set(venue.id, marker)
    }
  })
}

onMounted(async () => {
  if (!mapContainer.value) return

  L = await import('leaflet')
  map = L.map(mapContainer.value).setView(props.center, props.zoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  map.on('moveend', emitBounds)
  map.on('zoomend', emitBounds)
  emitBounds()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  markers.clear()
  glowCircles.clear()
})

watch(() => props.venues, () => updateMarkers(), { deep: true })

watch(() => props.center, (newCenter) => {
  if (map) map.setView(newCenter, props.zoom)
})
</script>

<template>
  <div ref="mapContainer" class="w-full h-full min-h-[400px] relative">
    <!-- Map Legend -->
    <div class="absolute bottom-8 left-2.5 z-[1000] bg-white/95 backdrop-blur rounded-lg px-4 py-3 shadow-lg border border-black/10 text-sm">
      <div class="font-semibold text-slate-800 mb-2.5 text-sm">{{ $t('map.title.legend') }}</div>
      <div class="flex items-center gap-2.5 mb-1.5">
        <span class="w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 border-2 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.6),0_0_20px_rgba(251,191,36,0.3)] flex items-center justify-center">
          <span class="w-2.5 h-2.5 bg-white/70 rounded-full animate-pulse" />
        </span>
        <span class="text-slate-600 font-medium">{{ $t('map.label.sunny') }}</span>
      </div>
      <div class="flex items-center gap-2.5 mb-1.5">
        <span class="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 border-2 border-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
        <span class="text-slate-600 font-medium">{{ $t('map.label.shaded') }}</span>
      </div>
      <div class="flex items-center gap-2.5">
        <span class="w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 border-2 border-orange-500 shadow-[0_0_6px_rgba(253,186,116,0.4)]" />
        <span class="text-slate-600 font-medium">{{ $t('map.label.partiallySunny') }}</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Global styles for Leaflet markers */
.sunny-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.sunny-marker-element {
  filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.8));
}

.venue-popup {
  min-width: 180px;
}

.venue-popup h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.venue-popup .status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.venue-popup .status.sunny {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.venue-popup .status.partial {
  background: linear-gradient(135deg, #ffedd5, #fed7aa);
  color: #c2410c;
  border: 1px solid #fdba74;
}

.venue-popup .status.shaded {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  color: #475569;
  border: 1px solid #cbd5e1;
}
</style>
