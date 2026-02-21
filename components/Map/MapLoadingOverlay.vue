<script setup lang="ts">
type Props = {
  isLoading: boolean
}

defineProps<Props>()
</script>

<template>
  <div
    v-if="isLoading"
    class="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-4 z-[200] font-medium text-slate-600"
  >
    <div class="w-10 h-10 border-4 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
    <span>{{ $t('map.message.loadingMap') }}</span>
  </div>
</template>
