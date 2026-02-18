<script setup lang="ts">
const { locale, setLocale, locales } = useI18n()

const availableLocales = computed(() => {
  return locales.value as Array<{ code: string; name: string }>
})

async function switchLocale(code: string): Promise<void> {
  await setLocale(code as 'es' | 'en')
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button
      v-for="loc in availableLocales"
      :key="loc.code"
      :title="loc.name"
      :class="[
        'flex items-center justify-center px-3 py-2 border-2 rounded-full text-xs font-semibold tracking-wide cursor-pointer transition-all duration-200',
        locale === loc.code
          ? 'border-amber-500 bg-amber-100 text-amber-700'
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-700'
      ]"
      @click="switchLocale(loc.code)"
    >
      {{ loc.code.toUpperCase() }}
    </button>
  </div>
</template>
