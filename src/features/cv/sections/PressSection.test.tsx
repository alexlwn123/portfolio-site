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
      expect(
        within(items[index] as HTMLElement).getByRole('link', { name: item.title }),
      ).toHaveAttribute('href', item.url)
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
    expect(npr).toHaveTextContent('The piece names neither the event nor him.')
    expect(npr).not.toHaveTextContent(/featur|profil|interview/i)
  })

  it('renders nothing for a missing programme, reporter, date or claim', () => {
    const section = renderSection()
    const reference = section.getAllByRole('listitem').at(-1)

    expect(reference?.querySelector('time')).toBeNull()
    expect(reference).toHaveTextContent(/^AI Hack for Freedom\s*Winners of all three editions$/)
  })
})
