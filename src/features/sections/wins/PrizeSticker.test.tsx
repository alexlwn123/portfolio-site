import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import foil from '../../stickers/foil.module.css'
import { PrizeSticker } from './PrizeSticker'
import styles from './PrizeSticker.module.css'
import type { StickerShape } from './stickerLooks'
import { type WinFacts, winFacts } from './winFacts'

const facts = winFacts(content)

function fact(id: string): WinFacts {
  const found = facts.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No facts for the win "${id}"`)
  }
  return found
}

function renderSticker(id: string, shape: StickerShape, lifting = false): HTMLElement {
  const { container } = render(<PrizeSticker win={fact(id)} look={{ shape, lifting }} />)
  const sticker = container.firstElementChild
  if (!(sticker instanceof HTMLElement)) {
    throw new Error('Expected the sticker to be an element')
  }
  return sticker
}

describe('PrizeSticker', () => {
  it('letters the place, the project, the event and the year', () => {
    const sticker = renderSticker('lightning-welder', 'hex')

    expect(sticker).toHaveTextContent(/^1st\s*Lightning Welder\s*bitcoin\+\+ Berlin\s*2024$/)
  })

  it('is a drawing: the same facts are printed beside it as text', () => {
    const sticker = renderSticker('pleb-fm', 'burst')

    expect(sticker).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('heading')).toBeNull()
    expect(sticker.querySelector('a')).toBeNull()
  })

  it('says its shape and its finish, so each can be found', () => {
    const sticker = renderSticker('pleb-fm', 'burst')

    expect(sticker).toHaveAttribute('data-prize', 'burst')
    expect(sticker).toHaveAttribute('data-finish', 'first')
    expect(sticker).toHaveClass(styles.sticker ?? '', styles.burst ?? '', styles.first ?? '')
  })

  it('cuts a first from holographic foil', () => {
    const face = renderSticker('auntie-ln', 'round').querySelector(`.${styles.face ?? ''}`)

    expect(face).toHaveClass(foil.foil ?? '')
  })

  it('cuts a second from brushed silver, not from foil', () => {
    const sticker = renderSticker('treepay-ux', 'shield')
    const face = sticker.querySelector(`.${styles.face ?? ''}`)

    expect(sticker).toHaveAttribute('data-finish', 'second')
    expect(sticker).toHaveClass(styles.second ?? '')
    expect(face).not.toHaveClass(foil.foil ?? '')
  })

  it('gives the prize its own shape and no place', () => {
    const sticker = renderSticker('bitdevs-upgrade', 'rosette')

    expect(sticker).toHaveAttribute('data-finish', 'prize')
    expect(sticker).toHaveTextContent(/^Prize\s*BitDevs Upgrade\s*AI4All\s*2023$/)
    expect(sticker.textContent).not.toMatch(/1st|2nd|3rd/)
    expect(sticker.querySelector(`.${styles.face ?? ''}`)).not.toHaveClass(foil.foil ?? '')
  })

  it('letters the team and the field for the win whose project is not known', () => {
    const sticker = renderSticker('ncr-global-hackathon-2021', 'medal')

    expect(sticker).toHaveTextContent(/^1st\s*of 300\+ teams\s*Team Eth Heads\s*NCR Global\s*2021$/)
  })

  it('lifts a corner when told to', () => {
    expect(renderSticker('arion-parking', 'slab', true)).toHaveClass(styles.lifting ?? '')
    expect(renderSticker('arion-parking', 'slab')).not.toHaveClass(styles.lifting ?? '')
  })

  it('is nothing the lid’s script would pick up', () => {
    const sticker = renderSticker('pleb-fm', 'burst')

    expect(sticker).not.toHaveAttribute('data-sticker')
    expect(sticker.querySelector('[data-sticker], [data-note], [data-peelable]')).toBeNull()
  })
})
