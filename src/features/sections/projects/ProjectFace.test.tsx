import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { ProjectFace } from './ProjectFace'
import { type Face, projectStickers } from './projectStickers'

const stickers = projectStickers(content)

describe('ProjectFace', () => {
  it.each(stickers.map((sticker) => [sticker.name, sticker] as const))(
    '%s has its name on its sticker',
    (name, sticker) => {
      const { container } = render(<ProjectFace id={sticker.id} face={sticker.face} />)
      const printed = container.textContent.toLowerCase().replaceAll(/\s+/g, ' ')

      for (const word of name.toLowerCase().split(' ')) {
        expect(printed).toContain(word)
      }
      expect(container.querySelector('[style]')).toBeNull()
    },
  )

  it('draws a shape of its own for a project that has one', () => {
    const drawn = stickers.filter(({ face }) => 'lines' in face && face.kind !== 'jukebox')

    expect(drawn.length).toBeGreaterThan(0)
    for (const { id, face } of drawn) {
      const { container, unmount } = render(<ProjectFace id={id} face={face} />)
      expect(container.querySelector('svg[aria-hidden="true"]'), id).not.toBeNull()
      unmount()
    }
  })

  it('reuses the lid’s crab, button, jukebox, hexagon and parking sign', () => {
    const texts = (id: string): string => {
      const sticker = stickers.find((candidate) => candidate.id === id)
      if (!sticker) {
        throw new Error(`No sticker for "${id}"`)
      }
      const { container, unmount } = render(<ProjectFace id={sticker.id} face={sticker.face} />)
      const text = container.textContent
      unmount()
      return text
    }

    expect(texts('clawthing-store')).toContain('Clawthing Store')
    expect(texts('last-pay-wins')).toContain('2.5M+ SATS IN WEEK ONE')
    expect(texts('pleb-fm')).toMatch(/Pleb FM\s+pleb\.fm/)
    expect(texts('lightning-welder')).toMatch(/1st overall.*Lightning.*Welder.*BTC\+\+ Berlin ’24/)
    expect(texts('arion-parking')).toMatch(/P.*Arion Parking/)
  })

  it('prints a bumper for a project with no drawing', () => {
    const face: Face = { kind: 'bumper', lines: ['A New', 'Thing'] }
    const { container } = render(<ProjectFace id="a-new-thing" face={face} />)

    expect(container).toHaveTextContent('A New Thing')
    expect(container.querySelector('svg')).toBeNull()
  })

  it('gives each drawing ids of its own, so two on a page cannot collide', () => {
    const { container } = render(
      <>
        {stickers.map(({ id, face }) => (
          <ProjectFace key={id} id={id} face={face} />
        ))}
      </>,
    )
    const ids = [...container.querySelectorAll('[id]')].map(({ id }) => id)

    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
