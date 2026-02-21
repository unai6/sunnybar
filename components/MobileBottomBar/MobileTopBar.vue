<script setup lang="ts">
</script>

<template>
  <div
    class="lg:hidden fixed top-0 left-0 right-0 z-[300] bg-white/95 backdrop-blur-sm border-b border-gray-200 px-3 py-1.5"
    style="padding-top: calc(0.375rem + env(safe-area-inset-top, 0px))"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <i class="pi pi-sun text-base text-amber-500" />
        <span class="text-sm font-bold bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">
          SunBar
        </span>
        <span class="text-[9px] text-gray-400 ml-1">v1.0.0</span>
      </div>
      <LocaleSwitcher />
    </div>
  </div>
</template>
