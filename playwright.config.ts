import { defineConfig, devices } from '@playwright/test'

// A dedicated port, so the specs never run against a dev server by accident:
// the dev server injects scripts, and these specs assert that none are shipped.
const PORT = 4391

// --ignore-lock makes this a one-off foreground server. Without it, Astro
// detaches the preview server into the background whenever it detects an AI
// coding agent, and Playwright reports that its web server exited early.
const PREVIEW_FLAGS = `--host 127.0.0.1 --port ${String(PORT)} --ignore-lock`
const BASE_URL = `http://127.0.0.1:${String(PORT)}`
const SERVER_TIMEOUT_MS = 120_000
/**
 * How long an expectation waits. The lid's springs and its lamp take about
 * half a second to settle, and headless Chromium draws slowly when other
 * suites share the machine, so they are given time to.
 */
const EXPECT_TIMEOUT_MS = 10_000

const isCi = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: [['list']],
  expect: { timeout: EXPECT_TIMEOUT_MS },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec astro build && pnpm exec astro preview ${PREVIEW_FLAGS}`,
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: SERVER_TIMEOUT_MS,
  },
})
