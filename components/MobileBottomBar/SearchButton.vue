<script setup lang="ts">
type Props = {
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  search: []
}>()
</script>

<template>
  <button
    :disabled="loading"
    class="flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
    :class="loading ? 'bg-gray-100 text-gray-400' : 'bg-amber-500 text-white active:bg-amber-600'"
    @click="emit('search')"
  >
    <i :class="loading ? 'pi pi-spin pi-spinner text-base' : 'pi pi-refresh text-base'" />
    <span class="text-[10px] mt-0.5 font-medium">{{ $t('controlPanel.mobile.search') }}</span>
  </button>
</template>
