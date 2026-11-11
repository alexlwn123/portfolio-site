import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SHARED_IDS } from '../../../stickers/svgIds'
import type { DrawnKind } from '../projectStickers'
import { Lettering } from './Lettering'
import { DRAWINGS } from './index'

const KINDS = Object.keys(DRAWINGS) as readonly DrawnKind[]

function draw(kind: DrawnKind, lines: readonly string[] = ['Rough', 'Consensus']): HTMLElement {
  const Drawing = DRAWINGS[kind]
  return render(<Drawing id={`a-${kind}`} lines={lines} />).container
}

/** Every id a drawing points at: in a fill, a filter or an href. */
function references(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('*')].flatMap((element) =>
    ['fill', 'filter', 'href', 'clip-path', 'mask'].flatMap((name) => {
      const value = element.getAttribute(name) ?? ''
      const match = /#([\w-]+)/.exec(value)
      return match?.[1] === undefined ? [] : [match[1]]
    }),
  )
}

describe('the drawings', () => {
  it('has one for every shape the section cuts', () => {
    expect([...KINDS].sort()).toEqual(
      [
        'bubble',
        'capsule',
        'computer',
        'crate',
        'knight',
        'mint',
        'plinko',
        'puzzle',
        'ramp',
        'shield',
        'stamp',
        'ticket',
        'tree',
      ].sort(),
    )
  })

  it.each(KINDS)('%s is hidden from assistive technology and cannot take focus', (kind) => {
    const container = draw(kind)
    const svg = container.querySelector('svg')

    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('viewBox')
    expect(container.querySelector('[style]')).toBeNull()
  })

  it.each(KINDS)('%s is lettered with the name it is given, a word apart', (kind) => {
    const container = draw(kind)
    const lettered = [...container.querySelectorAll('text')].map((text) => text.textContent)

    expect(lettered.join('')).toContain('Rough')
    expect(lettered.join('')).toContain('Consensus')
    expect(container.textContent).toMatch(/Rough\s+Consensus/)
  })

  it.each(KINDS)('%s takes a name of one line as well', (kind) => {
    const container = draw(kind, ['kattis'])

    expect(container.textContent.trim()).toBe('kattis')
  })

  it.each(KINDS)('%s keeps its ids to itself', (kind) => {
    const container = draw(kind)
    const ids = [...container.querySelectorAll('[id]')].map(({ id }) => id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id.startsWith(`a-${kind}-`)).toBe(true)
    }
    for (const reference of references(container)) {
      expect([...ids, ...Object.values(SHARED_IDS)]).toContain(reference)
    }
  })
})

describe('Lettering', () => {
  const at = { x: 100, y: 80, width: 140, max: 34 }

  function letter(lines: readonly string[], anchor?: 'start'): readonly SVGTextElement[] {
    const { container } = render(
      <svg>
        <Lettering lines={lines} at={at} anchor={anchor ?? 'middle'} />
      </svg>,
    )
    return [...container.querySelectorAll('text')]
  }

  it('sets each line where the fit puts it, centred across', () => {
    const [first, second] = letter(['Cargo', 'Leaderboard'])

    expect(first).toHaveAttribute('font-size', '34')
    expect(second).toHaveAttribute('font-size', '17.1')
    expect(Number(second?.getAttribute('y'))).toBeGreaterThan(Number(first?.getAttribute('y')))
    for (const text of [first, second]) {
      expect(text).toHaveAttribute('x', '100')
      expect(text).toHaveAttribute('text-anchor', 'middle')
    }
  })

  it('can start its lines from the left instead', () => {
    expect(letter(['One'], 'start')[0]).toHaveAttribute('text-anchor', 'start')
  })
})
