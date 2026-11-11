import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { PERSONAL_MAIL_DOMAINS } from '../../../content/schema'
import { ContactSection } from './ContactSection'

const { profile } = content

describe('ContactSection', () => {
  it('shows the work email as a mailto link', () => {
    render(<ContactSection profile={profile} />)
    const section = within(screen.getByRole('region', { name: 'Contact' }))

    expect(section.getByRole('link', { name: profile.email })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
  })

  it('shows no personal mailbox', () => {
    render(<ContactSection profile={profile} />)
    const text = screen.getByRole('region').textContent.toLowerCase()

    for (const domain of PERSONAL_MAIL_DOMAINS) {
      expect(text).not.toContain(domain)
    }
  })

  it('links to every profile and to the site itself', () => {
    render(<ContactSection profile={profile} />)
    const section = within(screen.getByRole('region', { name: 'Contact' }))

    for (const link of profile.links) {
      expect(section.getByRole('link', { name: link.label })).toHaveAttribute('href', link.url)
    }
    expect(section.getByRole('link', { name: 'alex.lwn.lol' })).toHaveAttribute(
      'href',
      profile.site,
    )
  })
})
