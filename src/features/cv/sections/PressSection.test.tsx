import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { PressSection } from './PressSection'

function renderSection() {
  render(<PressSection press={content.press} sources={content} />)
  return within(screen.getByRole('region', { name: 'Press' }))
}

describe('PressSection', () => {
  it('lists every press item with its outlet and a link to it', () => {
    const section = renderSection()

    const items = section.getAllByRole('listitem')
    expect(items).toHaveLength(content.press.length)
    content.press.forEach((item, index) => {
      expect(items[index]).toHaveTextContent(item.outlet)
      expect(items[index]?.querySelector('a')).toHaveAttribute('href', item.url)
    })
  })

  it('says only that a hackathon he helped organize was covered by NPR', () => {
    const section = renderSection()
    const [npr] = section.getAllByRole('listitem')

    expect(npr).toHaveTextContent('NPR')
    expect(npr).toHaveTextContent('All Things Considered')
    expect(npr).toHaveTextContent('Jenna McLaughlin')
    expect(npr).toHaveTextContent('October 27, 2026')
    expect(npr).toHaveTextContent(
      'Coverage of AI Hack for Freedom III in Washington, DC, a hackathon he helped organize.',
    )
    // What the piece is, and no more: nothing about who it names, and no more than is true.
    expect(npr).not.toHaveTextContent(/names neither|does not name/i)
    expect(npr).not.toHaveTextContent(/featur|profil|interview/i)
  })

  it('links the headline when the file records one, and the derived claim when it does not', () => {
    const section = renderSection()

    expect(
      section.getByRole('link', {
        name: 'Human rights activists look to harness AI for the greater good',
      }),
    ).toBeVisible()
    expect(
      section.getByRole('link', {
        name: 'Announcement of the AI Hack for Freedom I winners, with Stringer Safety placed 1st.',
      }),
    ).toBeVisible()
    expect(section.queryByText(/does not name/i)).toBeNull()
  })

  it('never repeats the claim when the claim is already the link', () => {
    const section = renderSection()

    expect(section.getAllByText(/^Announcement of the AI Hack for Freedom I winners/)).toHaveLength(
      1,
    )
    expect(section.getAllByText('Winners of all three editions')).toHaveLength(1)
  })

  it('renders nothing for a missing programme, reporter, date or headline', () => {
    const section = renderSection()
    const reference = section.getAllByRole('listitem').at(-1)

    expect(reference?.querySelector('time')).toBeNull()
    expect(reference).toHaveTextContent(/^AI Hack for Freedom\s*Winners of all three editions$/)
  })
})
