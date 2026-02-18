<script setup lang="ts">
import { ref } from 'vue'

const { locale, setLocale, locales } = useI18n()

const menuOpen = ref(false)

const availableLocales = computed(() => {
  return locales.value as Array<{ code: string; name: string }>
})

const switchLocale = async (code: string) => {
  await setLocale(code as 'es' | 'en')
  closeMenu()
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}
</script>

<template>
  <div class="flex items-center">
    <!-- Desktop view -->
    <div class="hidden md:flex gap-1">
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

    <!-- Mobile burger menu -->
    <div class="flex relative md:hidden">
      <button
        :aria-label="$t('header.button.menu')"
        class="flex items-center justify-center w-10 h-10 border-none rounded-lg bg-gray-100 text-gray-700 text-xl cursor-pointer transition-colors duration-200 hover:bg-gray-200"
        @click="toggleMenu"
      >
        <i class="pi pi-bars" />
      </button>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-x-full"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="menuOpen"
          class="fixed top-0 right-0 bottom-0 w-[280px] max-w-[80vw] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.15)] z-50 flex flex-col"
        >
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 font-semibold text-gray-700">
            <span>{{ $t('header.label.language') }}</span>
            <button
              class="flex items-center justify-center w-8 h-8 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-colors duration-200 hover:bg-gray-100"
              @click="closeMenu"
            >
              <i class="pi pi-times" />
            </button>
          </div>
          <div class="flex-1 p-3 overflow-y-auto">
            <button
              v-for="loc in availableLocales"
              :key="loc.code"
              :class="[
                'flex items-center gap-3 w-full px-4 py-3.5 border-none rounded-lg text-left cursor-pointer transition-colors duration-200',
                locale === loc.code ? 'bg-amber-100' : 'bg-transparent hover:bg-gray-100'
              ]"
              @click="switchLocale(loc.code)"
            >
              <span
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold',
                  locale === loc.code
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                    : 'bg-gray-100 text-gray-500'
                ]"
              >
                {{ loc.code.toUpperCase() }}
              </span>
              <span class="flex-1 text-base text-gray-700">{{ loc.name }}</span>
              <i v-if="locale === loc.code" class="pi pi-check text-amber-500 text-sm" />
            </button>
          </div>
        </div>
      </Transition>

      <!-- Backdrop -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="menuOpen"
          class="fixed inset-0 bg-black/40 z-40"
          @click="closeMenu"
        />
      </Transition>
    </div>
  </div>
</template>
