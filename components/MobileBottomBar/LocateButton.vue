<script setup lang="ts">
const emit = defineEmits<{
  locate: []
}>()
</script>

<template>
  <button
    class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200"
    @click="emit('locate')"
  >
    <i class="pi pi-map-marker text-base" />
    <span class="text-[10px] mt-0.5">{{ $t('controlPanel.mobile.locate') }}</span>
  </button>
</template>
