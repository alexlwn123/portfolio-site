import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrastRatio } from './contrast'

const css = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8')

const AA_NORMAL_TEXT = 4.5
const MAX_ALIAS_DEPTH = 5

function rawToken(name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)
  if (!match?.[1]) {
    throw new Error(`tokens.css does not define --${name}`)
  }
  return match[1].trim()
}

/** Follows `var(--other)` aliases until it reaches a literal value. */
function token(name: string, depth = 0): string {
  const value = rawToken(name)
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value)
  if (!alias?.[1]) {
    return value
  }
  if (depth >= MAX_ALIAS_DEPTH) {
    throw new Error(`--${name} is aliased too deeply`)
  }
  return token(alias[1], depth + 1)
}

describe('design tokens', () => {
  it.each([
    ['ink', '#17122b'],
    ['cobalt', '#2b35f5'],
    ['deep', '#1b1fa8'],
    ['tang', '#ff6b1a'],
    ['gum', '#ff4fa3'],
    ['hi', '#eeff41'],
    ['mint', '#2fe6b5'],
  ])('carries the mockup palette: --%s is %s', (name, hex) => {
    expect(token(name).toLowerCase()).toBe(hex)
  })

  it.each([
    ['font-display', 'Bowlby One'],
    ['font-body', 'Bricolage Grotesque'],
    ['font-marker', 'Permanent Marker'],
  ])('names the mockup typefaces: --%s uses %s', (name, family) => {
    expect(token(name)).toContain(family)
  })

  it.each([
    ['color-text', 'color-surface'],
    ['color-text-muted', 'color-surface'],
    ['color-accent', 'color-surface'],
    ['color-text', 'color-surface-sunken'],
    ['color-text-muted', 'color-surface-sunken'],
    ['color-accent', 'color-surface-sunken'],
    ['color-on-accent', 'color-accent'],
    ['color-on-accent-highlight', 'color-accent'],
  ])('keeps --%s readable on --%s (at least 4.5:1)', (foreground, background) => {
    expect(contrastRatio(token(foreground), token(background))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    )
  })

  it('sizes type in rem', () => {
    const sizes = [...css.matchAll(/--text-[a-z0-9-]+:\s*([^;]+);/g)].map((match) => match[1])

    expect(sizes.length).toBeGreaterThan(0)
    for (const size of sizes) {
      expect(size).toMatch(/rem\)?$/)
    }
  })
})
