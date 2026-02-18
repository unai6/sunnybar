/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      colors: {
        sunbar: {
          primary: '#f59e0b',
          secondary: '#3b82f6',
          sunny: '#fbbf24',
          shaded: '#6b7280',
          background: '#f8fafc'
        }
      }
    }
  },
  plugins: []
}
