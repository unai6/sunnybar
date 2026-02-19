import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

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
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],

  i18n: {
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'ca', name: 'Català', file: 'ca.json' }
    ],
    defaultLocale: 'es',
    lazy: true,
    langDir: './',
    strategy: 'prefix_except_default',
    vueI18n: './i18n.config.ts'
  },

  css: ['primeicons/primeicons.css', '~/assets/css/main.css'],

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
    arcgisApiKey: process.env.ARCGIS_API_KEY || '',
    public: {
      overpassApiUrl: 'https://overpass-api.de/api/interpreter'
    }
  },

  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        { name: 'theme-color', content: '#D97706' },
        { name: 'msapplication-TileColor', content: '#D97706' },
        { name: 'msapplication-config', content: '/browserconfig.xml' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/icon-512x512.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png'
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png'
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png'
        },
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
    server: {
      allowedHosts: ['uncollusive-juelz-finished.ngrok-free.dev']
    },
    resolve: {
      alias: {
        '@arcgis/core': '@arcgis/core'
      }
    }
  },

  nitro: {
    preset: 'netlify'
  },

  // Ensure ArcGIS works with SSR disabled for the map component
  ssr: false,

  compatibilityDate: '2024-09-01'
})
