import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { ProjectSticker } from './ProjectSticker'
import styles from './ProjectSticker.module.css'
import { projectStickers, type ProjectSticker as Spec } from './projectStickers'

const stickers = projectStickers(content)

function spec(id: string): Spec {
  const found = stickers.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No sticker for "${id}"`)
  }
  return found
}

function renderSticker(sticker: Spec): HTMLElement {
  render(
    <ul>
      <ProjectSticker sticker={sticker} />
    </ul>,
  )
  // A sticker printed in words may say more than the name: the jukebox adds its address.
  return screen.getByRole('listitem', { name: (name) => name.startsWith(sticker.name) })
}

describe('ProjectSticker', () => {
  it('is a list item named by its heading, which is the project’s name', () => {
    const item = renderSticker(spec('btc-plinko'))

    expect(item).toHaveAttribute('data-project', 'btc-plinko')
    expect(item).toHaveAttribute('data-face', 'plinko')
    expect(within(item).getByRole('heading', { level: 3, name: 'BTC Plinko' })).toBeInTheDocument()
  })

  it('marks a winner, so that the mat can leave room over it for its flag', () => {
    expect(renderSticker(spec('auntie-ln'))).toHaveAttribute('data-won', '')
  })

  it('leaves a project that did not win unmarked', () => {
    expect(renderSticker(spec('btc-plinko'))).not.toHaveAttribute('data-won')
  })

  it('makes the sticker itself a link to the project', () => {
    const item = renderSticker(spec('btc-plinko'))
    const heading = within(item).getByRole('heading', { level: 3 })

    expect(within(heading).getByRole('link', { name: 'BTC Plinko' })).toHaveAttribute(
      'href',
      'https://github.com/alexlwn123/btc-plinko',
    )
  })

  it('lets a sticker that is printed in words name itself', () => {
    const item = renderSticker(spec('arion-parking'))
    const link = within(within(item).getByRole('heading', { level: 3 })).getByRole('link')

    expect(link).not.toHaveAttribute('aria-label')
    expect(link).toHaveAccessibleName('Arion Parking')
    expect(link).toHaveAttribute('href', 'https://arionparking.tech')
  })

  it('writes a short description by hand and prints a long one on tape', () => {
    const plinko = renderSticker(spec('btc-plinko'))
    expect(within(plinko).getByText('Plinko with sats.')).toHaveClass(styles.hand ?? '')

    const cargo = renderSticker(spec('cargo-leaderboard'))
    expect(
      within(cargo).getByText(
        'A Rust competition for the biggest builds, biggest cleans, and longest compile times.',
      ),
    ).toHaveClass(styles.tape ?? '')
  })

  it('lists every link of the record, each named for the project', () => {
    const item = renderSticker(spec('pleb-fm'))
    const links = within(item).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://pleb.fm',
      '/#wins',
      'https://pleb.fm',
      'https://github.com/PlebFM/PlebFM',
      'https://youtu.be/_AwXSzzc9k0?t=839',
    ])
    expect(within(item).getByRole('link', { name: 'Demo video: Pleb FM' })).toBeInTheDocument()
  })

  it('flags a winner with its result, and leaves the others unflagged', () => {
    const welder = renderSticker(spec('lightning-welder'))
    expect(
      within(welder).getByRole('link', {
        name: /^Lightning Welder:\s*1st overall\s+bitcoin\+\+ Berlin, ecash edition 2024$/,
      }),
    ).toHaveAttribute('href', '/#wins')

    const kattis = renderSticker(spec('kattis'))
    expect(within(kattis).queryByRole('link', { name: /^kattis:/ })).toBeNull()
  })

  it('says which project is his day job, and only that one', () => {
    expect(within(renderSticker(spec('finite-computer'))).getByText('my day job')).toBeVisible()
    expect(within(renderSticker(spec('fedimint-sdk'))).queryByText('my day job')).toBeNull()
  })

  it('attaches no caption when there is nothing to say', () => {
    const item = renderSticker({ ...spec('kattis'), description: null, caption: null })

    expect(item.querySelector('p')).toBeNull()
  })

  it('has no inline styles', () => {
    expect(renderSticker(spec('finite-computer')).querySelector('[style]')).toBeNull()
  })
})
