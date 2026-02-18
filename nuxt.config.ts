import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const SunBarPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{amber.50}',
      100: '{amber.100}',
      200: '{amber.200}',
      300: '{amber.300}',
      400: '{amber.400}',
      500: '#D97706',
      600: '{amber.700}',
      700: '{amber.800}',
      800: '{amber.900}',
      900: '{amber.950}'
    }
  }
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    '@nuxtjs/i18n'
  ],

  i18n: {
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'es',
    lazy: true,
    langDir: './',
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts'
  },

  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ],

  primevue: {
    options: {
      ripple: true,
      theme: {
        preset: SunBarPreset,
        options: {
          darkModeSelector: false
        }
      }
    }
  },

  runtimeConfig: {
    public: {
      overpassApiUrl: 'https://overpass-api.de/api/interpreter'
    }
  },

  app: {
    head: {
      title: 'SunBar - Find Sunny Terraces',
      meta: [
        { name: 'description', content: 'Discover bars and restaurants with sunny terraces' },
        { name: 'theme-color', content: '#D97706' },
        { name: 'msapplication-TileColor', content: '#D97706' },
        { name: 'msapplication-config', content: '/browserconfig.xml' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'SunBar - Find Sunny Terraces' },
        { property: 'og:description', content: 'Discover bars and restaurants with sunny terraces' },
        { property: 'og:image', content: '/icon-512x512.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  vite: {
    optimizeDeps: {
      exclude: ['@arcgis/core']
    },
    resolve: {
      alias: {
        '@arcgis/core': '@arcgis/core'
      }
    }
  },

  // Ensure ArcGIS works with SSR disabled for the map component
  ssr: false,

  compatibilityDate: '2024-09-01'
})
