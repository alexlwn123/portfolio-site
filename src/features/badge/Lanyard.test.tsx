import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { STRAP_LINES } from '../stickers/geometry/lanyard'
import { Lanyard } from './Lanyard'

function renderLanyard() {
  const { container } = render(
    <Lanyard id="lanyard" left={['alex.lwn.lol', 'ATL']} right={['HACK', 'ORGANIZE', 'REPEAT']} />,
  )
  const [left, right] = [...container.querySelectorAll('[data-strap]')]
  if (!left || !right) {
    throw new Error('The lanyard has two straps')
  }
  return { container, left, right }
}

/** The points a path is drawn through, as its `d` gives them. */
function pointsOf(path: Element | null): readonly number[][] {
  const numbers = (path?.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g) ?? []
  return numbers.flatMap((_, index) =>
    index % 2 === 0 ? [[Number(numbers[index]), Number(numbers[index + 1])]] : [],
  )
}

describe('Lanyard', () => {
  it('is one drawing of two straps, each a line from above the lid to the clip', () => {
    const { container, left, right } = renderLanyard()

    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild?.tagName).toBe('svg')
    expect(container.firstElementChild).toHaveAttribute('viewBox', '0 0 260 300')
    expect(pointsOf(left.querySelector('#lanyard-left'))).toEqual([
      [STRAP_LINES.left.from.x, STRAP_LINES.left.from.y],
      [STRAP_LINES.left.to.x, STRAP_LINES.left.to.y],
    ])
    expect(pointsOf(right.querySelector('#lanyard-right'))).toEqual([
      [STRAP_LINES.right.from.x, STRAP_LINES.right.from.y],
      [STRAP_LINES.right.to.x, STRAP_LINES.right.to.y],
    ])
  })

  it('says which end of each strap is fixed above the lid, and which line the page’s script bends', () => {
    const { left, right } = renderLanyard()

    expect(left.querySelectorAll('[data-strap-line]')).toHaveLength(1)
    expect(left.querySelector('[data-strap-line]')).toHaveAttribute('id', 'lanyard-left')
    expect(right.querySelector('[data-strap-line]')).toHaveAttribute('id', 'lanyard-right')

    expect(left).toHaveAttribute('data-strap', 'from')
    expect(right).toHaveAttribute('data-strap', 'to')
  })

  it('draws each strap twice along the same line: a dark edge and the face over it', () => {
    const { left } = renderLanyard()
    const drawn = [...left.querySelectorAll('use')]

    expect(drawn).toHaveLength(2)
    for (const band of drawn) {
      expect(band).toHaveAttribute('href', '#lanyard-left')
    }
  })

  it('prints each strap’s words over and over along its line', () => {
    const { left, right } = renderLanyard()

    expect(left.textContent.startsWith('alex.lwn.lolATLalex.lwn.lolATL')).toBe(true)
    expect(right.textContent.startsWith('HACKORGANIZEREPEATHACK')).toBe(true)
    for (const word of left.querySelectorAll('textPath')) {
      expect(word).toHaveAttribute('href', '#lanyard-left')
      expect(word.getAttribute('startOffset')).toMatch(/^\d+(\.\d+)?%$/)
      expect(Number(word.getAttribute('textLength'))).toBeGreaterThan(0)
    }
  })

  it('draws a star after each word, on a line the stars ride along the strap', () => {
    const { container, left, right } = renderLanyard()

    for (const strap of [left, right]) {
      const stars = strap.querySelector('[data-strap-stars]')
      expect(pointsOf(stars)).toHaveLength(strap.querySelectorAll('textPath').length)
      for (const end of ['marker-start', 'marker-mid', 'marker-end']) {
        expect(stars).toHaveAttribute(end, 'url(#lanyard-star)')
      }
    }
    expect(container.querySelector('marker#lanyard-star path')).not.toBeNull()
    expect(container.textContent).not.toMatch(/[✦★]/)
  })

  it('puts every star on its strap’s line, between the two ends', () => {
    const { left } = renderLanyard()
    const { from, to } = STRAP_LINES.left
    const slope = (to.y - from.y) / (to.x - from.x)

    for (const [x = 0, y = 0] of pointsOf(left.querySelector('[data-strap-stars]'))) {
      expect(y - from.y).toBeCloseTo((x - from.x) * slope, 1)
      expect(x).toBeGreaterThan(from.x)
    }
  })

  it('is a drawing for the eye only, and takes no focus', () => {
    const { container } = renderLanyard()

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveAttribute('focusable', 'false')
  })
})
