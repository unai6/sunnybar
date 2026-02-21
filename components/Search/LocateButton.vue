<script setup lang="ts">
import Button from 'primevue/button'


type Props = {
  variant?: 'desktop' | 'mobile'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'desktop'
})

const emit = defineEmits<{
  locate: []
}>()
</script>

<template>
  <!-- Desktop variant -->
  <Button
    v-if="props.variant === 'desktop'"
    :label="$t('controlPanel.button.useMyLocation')"
    icon="pi pi-map-marker"
    class="w-full"
    severity="secondary"
    outlined
    @click="emit('locate')"
  />

  <!-- Mobile variant -->
  <button
    v-else
    class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
    @click="emit('locate')"
  >
    <i class="pi pi-map-marker text-base" />
    <span class="text-[10px] mt-0.5">{{ $t('controlPanel.mobile.locate') }}</span>
  </button>
</template>
