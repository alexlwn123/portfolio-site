import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import tones from '../stickers/tones.module.css'
import { PinButton } from './PinButton'
import type { Pin } from './ribbons'

const winner: Pin = { id: 'winner', label: 'WINNER', count: '×9', href: '/#wins', tone: 'ink' }
const organizer: Pin = {
  id: 'organizer',
  label: 'ORGANIZER',
  count: '×16',
  href: '/#organized',
  tone: 'tang',
}

/** Every id a drawing points at: the path its lettering runs along, and each paint it is filled with. */
function pointedAt(drawing: Element): readonly string[] {
  const hrefs = [...drawing.querySelectorAll('[href]')].map(
    (element) => element.getAttribute('href') ?? '',
  )
  const paints = [...drawing.querySelectorAll('[fill^="url("]')].map((element) =>
    (element.getAttribute('fill') ?? '').replace(/^url\(|\)$/g, ''),
  )
  return [...hrefs, ...paints].map((reference) => reference.replace(/^#/, ''))
}

describe('PinButton', () => {
  it('is a link named for what is printed on it, to its own section, in this tab', () => {
    render(<PinButton pin={winner} />)

    const pin = screen.getByRole('link', { name: 'WINNER ×9' })
    expect(pin).toHaveAttribute('href', '/#wins')
    expect(pin).toHaveAttribute('data-pin')
    expect(pin).not.toHaveAttribute('target')
  })

  it('is cut from its own colour', () => {
    render(
      <>
        <PinButton pin={winner} />
        <PinButton pin={organizer} />
      </>,
    )

    expect(screen.getByRole('link', { name: 'WINNER ×9' })).toHaveClass(tones.ink ?? '')
    expect(screen.getByRole('link', { name: 'ORGANIZER ×16' })).toHaveClass(tones.tang ?? '')
  })

  it('is drawn as a round button: a drawing for the eye only, and the link’s one child', () => {
    render(<PinButton pin={winner} />)
    const pin = screen.getByRole('link', { name: 'WINNER ×9' })
    const drawing = pin.querySelector('svg')

    // The link keeps its place and the button inside it swings, so nothing else may sit in it.
    expect(pin.children).toHaveLength(1)
    expect(pin.firstElementChild).toBe(drawing)
    expect(drawing).toHaveAttribute('aria-hidden', 'true')
    expect(drawing).toHaveAttribute('focusable', 'false')
    expect(drawing).toHaveAttribute('data-pin-button')
    // Round: every shape of the button is a circle about the middle of a square drawing.
    expect(drawing).toHaveAttribute('viewBox', '0 0 100 100')
    const circles = [...(drawing?.querySelectorAll('circle') ?? [])]
    expect(circles.length).toBeGreaterThanOrEqual(3)
    expect(circles.every((circle) => circle.getAttribute('cx') === '50')).toBe(true)
    expect(circles.every((circle) => circle.getAttribute('cy') === '50')).toBe(true)
  })

  it('letters what it is around the top and its count across the middle', () => {
    render(<PinButton pin={organizer} />)
    const drawing = screen.getByRole('link', { name: 'ORGANIZER ×16' }).querySelector('svg')
    const around = drawing?.querySelector('textPath')
    const printed = [...(drawing?.querySelectorAll('text') ?? [])].map((text) => text.textContent)

    expect(around).toHaveTextContent('ORGANIZER')
    expect(around).toHaveAttribute('text-anchor', 'middle')
    expect(printed).toEqual(['ORGANIZER', '×16'])
  })

  it('has a metal rim, a face in its colour and a gloss over the print', () => {
    render(<PinButton pin={winner} />)
    const drawing = screen.getByRole('link', { name: 'WINNER ×9' }).querySelector('svg')
    const parts = [...(drawing?.children ?? [])].filter(({ tagName }) => tagName !== 'defs')
    const order = parts.map((part) => part.getAttribute('data-part'))

    // Painted from the back forwards: the gloss goes over the lettering, as a button's film does.
    expect(order).toEqual(['rim', 'face', 'label', 'count', 'gloss', 'edge', 'glint'])
    expect(drawing?.querySelector('linearGradient')).not.toBeNull()
    expect(drawing?.querySelector('radialGradient')).not.toBeNull()
  })

  it('gives every definition an id of its own, and points only at its own', () => {
    const { container } = render(
      <>
        <PinButton pin={winner} />
        <PinButton pin={organizer} />
      </>,
    )
    const ids = [...container.querySelectorAll('svg [id]')].map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const drawing of container.querySelectorAll('svg')) {
      const own = [...drawing.querySelectorAll('[id]')].map(({ id }) => id)
      expect(pointedAt(drawing).length).toBeGreaterThan(0)
      expect(pointedAt(drawing).filter((id) => !own.includes(id))).toEqual([])
    }
  })

  it('carries no inline style', () => {
    const { container } = render(<PinButton pin={winner} />)

    expect(container.querySelectorAll('[style]')).toHaveLength(0)
  })

  it('opens a pin that leaves the site in a new tab, like any other link', () => {
    render(<PinButton pin={{ ...winner, href: 'https://example.test/wins' }} />)

    expect(screen.getByRole('link', { name: 'WINNER ×9' })).toHaveAttribute('target', '_blank')
  })
})
