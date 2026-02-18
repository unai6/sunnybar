import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    semi: ['error', 'never'],
    'no-extra-semi': 'error',
    quotes: ['error', 'single'],
    'comma-dangle': ['error', 'never'],
    'vue/multi-word-component-names': 'off'
  }
})
