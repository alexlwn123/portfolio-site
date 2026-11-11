import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { foilGlowCentre, foilGradientTransform, FOIL_REST, NAME_GLOW_FIELD } from './foil'

const lidCss = readFileSync(resolve(import.meta.dirname, '../../lid/Lid.module.css'), 'utf8')

function cssNumber(name: string): number {
  return Number(new RegExp(`--${name}:\\s*([\\d.]+);`).exec(lidCss)?.[1])
}

describe('the foil at rest', () => {
  it('sits where the mockup’s script started it', () => {
    expect(foilGradientTransform(FOIL_REST)).toBe('translate(-39 0) rotate(-8 240 140)')
    expect(foilGlowCentre(FOIL_REST, NAME_GLOW_FIELD)).toEqual({ cx: '168', cy: '90' })
  })

  it('follows the light when a script moves it', () => {
    expect(foilGradientTransform({ x: 1, y: 1 })).toBe('translate(130 0) rotate(20 240 140)')
    expect(foilGlowCentre({ x: 0.5, y: 0.5 }, { width: 100, height: 50 })).toEqual({
      cx: '50',
      cy: '25',
    })
  })

  it('matches the --hx and --hy the stylesheet gives the CSS foil', () => {
    expect(cssNumber('hx')).toBe(FOIL_REST.x)
    expect(cssNumber('hy')).toBe(FOIL_REST.y)
  })
})
