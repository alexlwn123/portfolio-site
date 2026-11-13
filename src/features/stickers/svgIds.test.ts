import { describe, expect, it } from 'vitest'

import { fragment, paintRef, SHARED_IDS, svgId } from './svgIds'

describe('SVG ids', () => {
  it('prefixes a definition with the sticker that owns it', () => {
    expect(svgId('organized-count', 'ring')).toBe('organized-count-ring')
    expect(svgId('wins-count', 'ring')).not.toBe(svgId('organized-count', 'ring'))
  })

  it('keeps the shared definitions in their own namespace', () => {
    for (const id of Object.values(SHARED_IDS)) {
      expect(id).toMatch(/^lid-/)
    }
    expect(new Set(Object.values(SHARED_IDS)).size).toBe(Object.keys(SHARED_IDS).length)
  })

  it('writes references the way SVG attributes expect them', () => {
    expect(paintRef('lid-foil')).toBe('url(#lid-foil)')
    expect(fragment('name-text')).toBe('#name-text')
  })
})
