import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// TypeScript is type-checked by `tsc` only (no typescript-eslint / TS parser).
export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'convex/_generated',
    'playwright-report',
    'test-results',
    'blob-report',
    '**/*.{ts,tsx}',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
])
