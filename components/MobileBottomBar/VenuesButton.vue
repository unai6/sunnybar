<script setup lang="ts">
type Props = {
  venuesCount: number
}

defineProps<Props>()

const emit = defineEmits<{
  'show-venues': []
}>()
</script>

<template>
  <button
    class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-gray-700 transition-all duration-200 hover:bg-gray-100 active:scale-95 active:bg-gray-200 relative"
    @click="emit('show-venues')"
  >
    <i class="pi pi-list text-base" />
    <span class="text-[10px] mt-0.5">{{ $t('controlPanel.mobile.venues') }}</span>
    <span
      v-if="venuesCount > 0"
      class="absolute top-0.5 right-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
    >
      {{ venuesCount > 99 ? '99+' : venuesCount }}
    </span>
  </button>
</template>
