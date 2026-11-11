import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Note } from './Note'
import voice from './voice.module.css'

describe('Note', () => {
  it('is written in his hand: a title, a line to a sentence, then the links', () => {
    const { container } = render(
      <Note
        id="arion-parking-note"
        title="Arion Parking"
        lines={['Parking app that takes payment over the Lightning Network.', '1st, 2022.']}
        links={[{ label: 'Video', href: 'https://example.test/video' }]}
      />,
    )
    const note = container.firstElementChild

    expect(note).toHaveAttribute('id', 'arion-parking-note')
    expect(note).toHaveAttribute('data-note')
    expect(note).toHaveClass(voice.marker ?? '')
    expect([...container.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'Arion Parking',
      'Parking app that takes payment over the Lightning Network.',
      '1st, 2022.',
    ])
    expect(screen.getByRole('list')).toContainElement(screen.getByRole('link'))
  })

  it('reads out what each link belongs to', () => {
    render(
      <Note
        id="n"
        title="Arion Parking"
        lines={[]}
        links={[
          { label: 'Site', href: 'https://example.test/' },
          { label: 'Code', href: 'https://example.test/code' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Site: Arion Parking' })).toHaveAttribute(
      'href',
      'https://example.test/',
    )
    expect(screen.getByRole('link', { name: 'Code: Arion Parking' })).toHaveTextContent('Code')
  })

  it('carries no inline style and opens no new window', () => {
    const { container } = render(
      <Note id="n" title="T" lines={['one']} links={[{ label: 'Site', href: '/' }]} />,
    )

    expect(container.querySelectorAll('[style]')).toHaveLength(0)
    expect(container.querySelector('a[target]')).toBeNull()
  })
})
