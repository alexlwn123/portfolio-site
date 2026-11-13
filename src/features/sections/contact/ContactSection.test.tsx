import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { PATHS } from '../../../lib/paths'
import { ContactSection } from './ContactSection'
import { contactCopy } from './copy'
import { contactBands } from './links'

function renderSection(): HTMLElement {
  render(<ContactSection content={content} stats={stats} />)
  return screen.getByRole('region', { name: /^Say\s*hello$/ })
}

describe('ContactSection', () => {
  it('is the contact section, on the cutting mat, with a line in his hand under the title', () => {
    const section = renderSection()

    expect(section).toHaveAttribute('id', 'contact')
    expect(section).toHaveAttribute('data-surface', 'mat')
    expect(within(section).getByText(contactCopy.kicker)).toBeInTheDocument()
  })

  it('leads with the address label: his name, his city and the work address', () => {
    const section = renderSection()
    const label = section.querySelector('[data-return-label]')
    const [first] = within(section).getAllByRole('link')

    expect(label).toHaveTextContent(content.profile.name)
    expect(label).toHaveTextContent('Atlanta, GA')
    expect(first).toHaveAttribute('href', `mailto:${content.profile.email}`)
  })

  it('publishes the one address in the profile and no other', () => {
    const section = renderSection()
    const mailtos = [...section.querySelectorAll('a[href^="mailto:"]')]

    expect(mailtos).toHaveLength(1)
    expect(section.textContent.match(/[\w.+-]+@[\w.-]+/g)).toEqual([content.profile.email])
    expect(section.innerHTML).not.toMatch(/gmail|outlook|icloud|proton/i)
  })

  it('has a wristband strip for each of the four ways to reach him, in his order', () => {
    const list = within(renderSection()).getByRole('list', { name: contactCopy.bands.list })
    const strips = within(list).getAllByRole('link')

    expect(strips.map((link) => link.textContent.trim())).toEqual([
      'X',
      'GitHub',
      'Book 30 min',
      'LinkedIn',
    ])
    expect(strips.map((link) => link.getAttribute('href'))).toEqual(
      contactBands(content.profile.links).map(({ href }) => href),
    )
  })

  it('links to no other profile: not Devpost, not the bitcoin++ one, not the business-card page', () => {
    const section = renderSection()
    const hrefs = [...section.querySelectorAll('a')].map((link) => link.getAttribute('href') ?? '')

    expect(hrefs.filter((href) => /devpost|btcpp|qr\.lwn\.lol/.test(href))).toEqual([])
    expect(section).not.toHaveTextContent(/devpost|bitcoin\+\+|business.card/i)
  })

  it('makes no plea to be returned and offers no reward', () => {
    expect(renderSection()).not.toHaveTextContent(/if found|return to|reward/i)
  })

  it('offers the plain CV on an asset tag', () => {
    const tag = within(renderSection()).getByRole('link', { name: /Plain CV/ })

    expect(tag).toHaveAttribute('href', PATHS.cv)
    expect(tag).toHaveTextContent(contactCopy.cv.kicker)
  })

  it('has exactly the links it should: the address, the four strips and the CV', () => {
    const links = within(renderSection()).getAllByRole('link')

    expect(links).toHaveLength(contactBands(content.profile.links).length + 2)
    expect(links).toHaveLength(6)
    for (const link of links) {
      expect(link).toHaveAccessibleName(/\S/)
    }
  })

  it('closes the page with a line of small print', () => {
    const section = renderSection()
    const smallPrint = within(section).getByText(contactCopy.smallPrint)
    const body = section.querySelector('[data-section-body]')

    expect(body?.lastElementChild).toContainElement(smallPrint)
  })

  it('adds no heading under the title and carries no inline style', () => {
    const section = renderSection()

    expect(within(section).getAllByRole('heading')).toHaveLength(1)
    expect(section.querySelector('[style]')).toBeNull()
  })
})
