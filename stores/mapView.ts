import { defineStore } from 'pinia'
import { ref } from 'vue'

export type MapViewMode = '2d' | '3d';

export const useMapViewStore = defineStore('mapView', () => {
  const viewMode = ref<MapViewMode>('2d')

  function setViewMode(mode: MapViewMode) {
    viewMode.value = mode
  }

  function toggle() {
    viewMode.value = viewMode.value === '2d' ? '3d' : '2d'
  }

  return {
    viewMode,
    setViewMode,
    toggle
  }
})
