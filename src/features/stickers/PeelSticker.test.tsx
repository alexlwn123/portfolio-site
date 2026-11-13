import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PeelSticker } from './PeelSticker'
import styles from './PeelSticker.module.css'
import sticker from './Sticker.module.css'

const note = {
  title: 'Pleb FM',
  lines: ['Lightning-powered jukebox.', '1st at SatsxSW hackathon, 2022.'],
  links: [
    { label: 'Site', href: 'https://pleb.fm' },
    { label: 'Code', href: 'https://github.com/PlebFM/PlebFM' },
  ],
}

function noteOf(placed: HTMLElement): HTMLElement {
  const found = placed.querySelector<HTMLElement>('[data-note]')
  if (!found) {
    throw new Error('Expected a note under the sticker')
  }
  return found
}

function renderSticker(shape?: 'card' | 'round'): HTMLElement {
  const { container } = render(
    <PeelSticker
      id="pleb-fm"
      href="https://pleb.fm"
      label="Pleb FM, a jukebox"
      peelLabel="Peel back Pleb FM"
      note={note}
      {...(shape === undefined ? {} : { shape })}
    >
      <span>face</span>
    </PeelSticker>,
  )
  return container.firstElementChild as HTMLElement
}

describe('PeelSticker', () => {
  it('is placed, shadowed and picked up like any sticker, and carries no inline style', () => {
    const placed = renderSticker()

    expect(placed).toHaveAttribute('data-sticker', 'pleb-fm')
    expect(placed).toHaveAttribute('data-grab')
    expect(placed).toHaveAttribute('data-peelable')
    expect(placed).toHaveClass(sticker.placed ?? '', sticker.sticker ?? '', styles.peelable ?? '')
    expect(placed).not.toHaveClass(styles.round ?? '')
    expect(placed.querySelectorAll('[style]')).toHaveLength(0)
    expect(placed).not.toHaveAttribute('data-peel')
  })

  it('keeps its face a link, named for what it shows', () => {
    renderSticker()

    const face = screen.getByRole('link', { name: 'Pleb FM, a jukebox' })
    expect(face).toHaveAttribute('href', 'https://pleb.fm')
    expect(face).toHaveTextContent('face')
  })

  it('opens its face in a new tab when it leaves the site', () => {
    renderSticker()

    const face = screen.getByRole('link', { name: 'Pleb FM, a jukebox' })
    expect(face).toHaveAttribute('target', '_blank')
    expect(face).toHaveAttribute('rel', 'noopener')
  })

  it('has a corner that peels: a button that waits, hidden, and points at the note', () => {
    const placed = renderSticker()

    const corner = placed.querySelector('button')
    const noteElement = placed.querySelector('[data-note]')
    expect(corner).toHaveAttribute('hidden')
    expect(corner).toHaveAttribute('type', 'button')
    expect(corner).toHaveAttribute('data-peel-tab')
    expect(corner).toHaveAttribute('aria-label', 'Peel back Pleb FM')
    expect(corner).toHaveAttribute('aria-expanded', 'false')
    expect(corner).toHaveAttribute('aria-controls', 'pleb-fm-note')
    expect(noteElement).toHaveAttribute('id', 'pleb-fm-note')
  })

  it('reads the face, then the corner, then the links of the note', () => {
    const placed = renderSticker()

    const stops = [...placed.querySelectorAll('a, button')].map(
      (stop) => stop.getAttribute('href') ?? stop.getAttribute('aria-label'),
    )
    expect(stops).toEqual([
      'https://pleb.fm',
      'Peel back Pleb FM',
      'https://pleb.fm',
      'https://github.com/PlebFM/PlebFM',
    ])
  })

  it('has the whole note in the page from the start', () => {
    const placed = renderSticker()
    const noteElement = noteOf(placed)

    expect(noteElement).toHaveTextContent('Pleb FM')
    expect(noteElement).toHaveTextContent('Lightning-powered jukebox.')
    expect(noteElement).toHaveTextContent('1st at SatsxSW hackathon, 2022.')
    expect(within(noteElement).getByRole('link', { name: 'Code: Pleb FM' })).toHaveAttribute(
      'href',
      'https://github.com/PlebFM/PlebFM',
    )
  })

  it('peels a round drawing from its rim', () => {
    expect(renderSticker('round')).toHaveClass(styles.round ?? '')
  })
})
