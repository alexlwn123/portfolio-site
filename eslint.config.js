import js from '@eslint/js'
import astro from 'eslint-plugin-astro'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Styling goes through CSS Modules and the design tokens, and markup is never
// built from strings. These selectors hold in .tsx and .astro files alike.
const bannedSyntax = [
  {
    selector: "JSXAttribute[name.name='style']",
    message: 'No inline styles: use a CSS Module and the design tokens.',
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message: 'No raw HTML injection.',
  },
  {
    selector: "Property[key.name='dangerouslySetInnerHTML']",
    message: 'No raw HTML injection.',
  },
]

export default defineConfig([
  globalIgnores([
    'dist/',
    '.astro/',
    'coverage/',
    'design/',
    'playwright-report/',
    'test-results/',
  ]),
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
    },
  },
  astro.configs['flat/recommended'],
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-set-html-directive': 'error',
    },
  },
  {
    // The JSON-LD data block is the single sanctioned use of set:html. Its
    // input is escaped by serializeJsonLd (src/features/seo/jsonLd.ts).
    files: ['src/features/seo/JsonLd.astro'],
    rules: {
      'astro/no-set-html-directive': 'off',
    },
  },
  {
    files: ['*.config.{js,ts}', 'tests/**/*.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    rules: {
      'no-console': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-restricted-syntax': ['error', ...bannedSyntax],
      'prefer-const': 'error',
    },
  },
])
