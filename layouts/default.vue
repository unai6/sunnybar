<script setup lang="ts">
import Toast from 'primevue/toast'
</script>

<template>
  <Toast position="top-center" />
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="hidden md:block bg-white border-b border-gray-200 px-6 py-3 shrink-0">
      <div class="flex items-center justify-between max-w-[1800px] mx-auto">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2">
            <i class="pi pi-sun text-2xl text-amber-500" />
            <span class="text-2xl font-bold bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">
              SunBar
            </span>
          </div>
          <p class="text-gray-500 text-sm hidden sm:block">{{ $t('header.label.tagline') }}</p>
        </div>
        <div class="flex items-center">
          <LocaleSwitcher />
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>
