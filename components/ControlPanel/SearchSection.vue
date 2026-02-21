<script setup lang="ts">
import Button from 'primevue/button'

type Props = {
  loading: boolean
}

defineProps<Props>()

defineEmits<{
  search: []
  'locate-me': []
}>()
</script>

<template>
  <div class="mb-6 md:mb-4">
    <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 md:mb-2 uppercase tracking-wider">
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
</template>
