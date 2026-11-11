import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const ROOT = resolve(import.meta.dirname, '../..')
const ASTRO_CLI = 'node_modules/astro/bin/astro.mjs'
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024

function describeFailure(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'stderr' in error) {
    return String(error.stderr)
  }
  return error instanceof Error ? error.message : String(error)
}

/**
 * Builds the site once before the build tests run. Set DIST_PREBUILT=1 to test
 * a dist/ that already exists (after `pnpm build`, for example).
 */
export default async function buildSite(): Promise<void> {
  if (process.env.DIST_PREBUILT === '1') {
    return
  }
  try {
    await run(process.execPath, [ASTRO_CLI, 'build'], {
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: 'production', ASTRO_TELEMETRY_DISABLED: '1' },
      maxBuffer: MAX_OUTPUT_BYTES,
    })
  } catch (error) {
    throw new Error(`astro build failed:\n${describeFailure(error)}`, { cause: error })
  }
}
