import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Theme guard: bg-dark-50/100 are TEXT tokens; using them as a background
    // renders as a dark slab in light mode. Use bg-dark-700/800 for surfaces.
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\bbg-dark-(50|100)(?![0-9])/]',
          message: 'Off-theme surface: use bg-dark-700/800 (or hover:bg-dark-700). The 50/100 steps are text tokens and look like a dark slab in light mode.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\bbg-dark-(50|100)(?![0-9])/]',
          message: 'Off-theme surface: use bg-dark-700/800 (or hover:bg-dark-700). The 50/100 steps are text tokens and look like a dark slab in light mode.',
        },
      ],
    },
  },
])
