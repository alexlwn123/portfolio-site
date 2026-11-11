import { defineConfig, devices } from '@playwright/test'

// A dedicated port, so the specs never run against a dev server by accident:
// the dev server injects scripts, and these specs assert that none are shipped.
const PORT = 4391
const BASE_URL = `http://127.0.0.1:${String(PORT)}`
const SERVER_TIMEOUT_MS = 120_000

const isCi = Boolean(process.env.CI)

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec astro build && pnpm exec astro preview --host 127.0.0.1 --port ${String(PORT)}`,
    url: `${BASE_URL}/`,
    reuseExistingServer: false,
    timeout: SERVER_TIMEOUT_MS,
  },
})
