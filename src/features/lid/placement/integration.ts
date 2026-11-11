import type { AstroIntegration } from 'astro'

import { lidPlacementCss } from './index'

/*
 * Delivers the placement stylesheet as a real stylesheet. A page imports
 * `virtual:lid-placement.css` and the build bundles it with the rest of that
 * page's CSS: no inline styles and no <style> element written by hand, so a
 * strict Content-Security-Policy stays possible.
 */

export const PLACEMENT_STYLESHEET = 'virtual:lid-placement.css'

/** Rollup's convention for a module that exists only in memory. */
const RESOLVED = `\0${PLACEMENT_STYLESHEET}`

/** The data the stylesheet is compiled from. A change to any restarts the dev server. */
const SOURCES = [
  './artboards.ts',
  './wide.ts',
  './desktop.ts',
  './phone.ts',
  './schema.ts',
  './toCss.ts',
  '../stickers.ts',
] as const

export interface StylesheetPlugin {
  readonly name: string
  readonly resolveId: (id: string) => string | undefined
  readonly load: (id: string) => string | undefined
}

/** A Vite plugin that answers the virtual module with the compiled stylesheet. */
export function placementStylesheet(compile: () => string = lidPlacementCss): StylesheetPlugin {
  return {
    name: 'lid-placement-stylesheet',
    resolveId: (id) => (id === PLACEMENT_STYLESHEET ? RESOLVED : undefined),
    load: (id) => (id === RESOLVED ? compile() : undefined),
  }
}

/** The Astro integration that installs the plugin and watches the placement data. */
export function lidPlacement(): AstroIntegration {
  return {
    name: 'lid-placement',
    hooks: {
      'astro:config:setup': ({ updateConfig, addWatchFile }) => {
        for (const source of SOURCES) {
          addWatchFile(new URL(source, import.meta.url))
        }
        updateConfig({ vite: { plugins: [placementStylesheet()] } })
      },
    },
  }
}
