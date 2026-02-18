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
      ripple: true
    },
    components: {
      include: '*'
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
        { name: 'description', content: 'Discover bars and restaurants with sunny terraces' }
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
