import { defineConfig } from 'vitest/config'

const COVERAGE_MINIMUM = 80

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts', 'src/test/**'],
      reporter: ['text', 'text-summary', 'html'],
      thresholds: {
        lines: COVERAGE_MINIMUM,
        branches: COVERAGE_MINIMUM,
        functions: COVERAGE_MINIMUM,
        statements: COVERAGE_MINIMUM,
      },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
        },
      },
      {
        test: {
          name: 'build',
          include: ['tests/build/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['./tests/build/globalSetup.ts'],
        },
      },
    ],
  },
})
