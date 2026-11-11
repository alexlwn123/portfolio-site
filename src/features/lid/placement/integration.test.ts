import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it, vi } from 'vitest'

import { lidPlacement, PLACEMENT_STYLESHEET, placementStylesheet } from './integration'

describe('placementStylesheet', () => {
  const plugin = placementStylesheet(() => '[data-sticker="name"]{left:1em}')

  it('claims the virtual stylesheet and nothing else', () => {
    const resolved = plugin.resolveId(PLACEMENT_STYLESHEET)

    expect(resolved).toMatch(/\.css$/)
    expect(plugin.resolveId('./Lid.module.css')).toBeUndefined()
    expect(plugin.load('./Lid.module.css')).toBeUndefined()
    expect(plugin.load(resolved ?? '')).toBe('[data-sticker="name"]{left:1em}')
  })

  it('compiles the real placements by default', () => {
    const real = placementStylesheet()

    expect(real.load(real.resolveId(PLACEMENT_STYLESHEET) ?? '')).toContain(
      '[data-sticker="badge"]',
    )
  })
})

describe('lidPlacement', () => {
  it('installs the plugin and watches the placement data', () => {
    const updateConfig = vi.fn()
    const addWatchFile = vi.fn<(file: URL) => void>()
    const setup = lidPlacement().hooks['astro:config:setup']

    void setup?.({ updateConfig, addWatchFile } as unknown as Parameters<typeof setup>[0])

    const watched = addWatchFile.mock.calls.map(([file]) => fileURLToPath(file))
    expect(watched.some((file) => file.endsWith('placement/desktop.ts'))).toBe(true)
    expect(watched.some((file) => file.endsWith('lid/stickers.ts'))).toBe(true)
    expect(watched.every((file) => existsSync(file))).toBe(true)
    expect(updateConfig).toHaveBeenCalledWith({
      vite: { plugins: [expect.objectContaining({ name: 'lid-placement-stylesheet' })] },
    })
  })
})
