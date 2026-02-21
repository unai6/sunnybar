<script setup lang="ts">
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
    <SearchButton
      :loading="loading"
      variant="desktop"
      @search="$emit('search')"
    />
    <div class="mt-2">
      <LocateButton
        variant="desktop"
        @locate="$emit('locate-me')"
      />
    </div>
  </div>
</template>
