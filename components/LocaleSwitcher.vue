<script setup lang="ts">
import Select from 'primevue/select'

const { locale, setLocale, locales } = useI18n()

const availableLocales = computed(() => {
  return locales.value as Array<{ code: string; name: string }>
})

const selectedLocale = computed({
  get: () => availableLocales.value.find(availableLocale => availableLocale.code === locale.value),
  set: (val) => {
    if (val) setLocale(val.code as 'es' | 'en' | 'ca')
  }
})
</script>

<template>
  <Select
    v-model="selectedLocale"
    :options="availableLocales"
    option-label="name"
    class="lg:w-40 xs:w-20 text-sm"
    :pt="{
      root: { class: 'border-gray-200 bg-gray-50 hover:border-gray-300 rounded-lg' },
      label: { class: 'text-sm py-1.5 px-3' }
    }"
  >
    <template #value="{ value }">
      <div v-if="value" class="flex items-center gap-2">
        <span class="font-semibold text-amber-700">{{ value.code.toUpperCase() }}</span>
        <span class="text-gray-600 hidden sm:inline">{{ value.name }}</span>
      </div>
    </template>
    <template #option="{ option }">
      <div class="flex items-center gap-2">
        <span class="font-semibold w-6">{{ option.code.toUpperCase() }}</span>
        <span>{{ option.name }}</span>
      </div>
    </template>
  </Select>
</template>
