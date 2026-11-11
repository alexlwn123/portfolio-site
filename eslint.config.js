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

// The owner's limits: small files, small functions, shallow nesting.
const MAX_FILE_LINES = 800
const MAX_FUNCTION_LINES = 50
const MAX_NESTING = 4

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
      'max-depth': ['error', MAX_NESTING],
      'max-lines': ['error', { max: MAX_FILE_LINES, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-param-reassign': ['error', { props: true }],
      'no-restricted-syntax': ['error', ...bannedSyntax],
      'prefer-const': 'error',
    },
  },
  {
    // Test files are one long describe() callback by design.
    files: ['**/*.{js,ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', '**/*.spec.ts'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // Components print what the content module gives them. A bare number in
    // one is either a fact that belongs in src/content or a missing constant.
    files: ['src/features/**/*.{ts,tsx}', 'src/lib/**/*.ts'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, enforceConst: true },
      ],
    },
  },
  {
    // The one exception to the rule above: modules that are nothing but
    // measurements. Placements are coordinates on an artboard and geometry is
    // the shape of a drawing, so their numbers are the data, not stray facts.
    // Components may not join this list: they read these modules instead.
    files: [
      'src/features/lid/placement/artboards.ts',
      'src/features/lid/placement/wide.ts',
      'src/features/lid/placement/desktop.ts',
      'src/features/lid/placement/phone.ts',
      'src/features/stickers/geometry/*.ts',
      'src/features/badge/photoCrop.ts',
    ],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },
])
