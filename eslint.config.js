import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Scripts de un solo uso que corren con `node` en la máquina del dev (setup
// de BD, seeds, smoke tests) — nunca se empaquetan para el navegador, así
// que necesitan los globals de Node (`process`, etc.) en vez de los de browser.
const NODE_SCRIPTS = ['apply-schema.js', 'verify-schema.js', 'apply-migration.js', 'seed-users.js', 'smoke-test.js'];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    ignores: NODE_SCRIPTS,
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  {
    files: NODE_SCRIPTS,
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
    rules: { 'no-unused-vars': 'off' },
  },
])
