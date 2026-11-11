import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Patent } from '../../../content'
import { PatentsSection } from './PatentsSection'

function renderSection(patents: readonly Patent[] = content.patents) {
  render(<PatentsSection patents={patents} stats={stats.patents} />)
  return within(screen.getByRole('region', { name: 'Patents' }))
}

describe('PatentsSection', () => {
  it('is the section the lid links to', () => {
    renderSection()

    expect(screen.getByRole('region', { name: 'Patents' })).toHaveAttribute('id', 'patents')
  })

  it('summarizes with derived numbers, keeping patents and applications apart', () => {
    const section = renderSection()

    expect(section.getByText('2 patents granted and 1 application pending.')).toBeVisible()
  })

  it('lists the granted patents first: number, title, grant date and a link', () => {
    const section = renderSection()
    const granted = within(section.getByRole('list', { name: 'Patents granted' })).getAllByRole(
      'listitem',
    )
    const [navigation, identity] = granted

    expect(granted).toHaveLength(stats.patents.granted)
    expect(navigation).toHaveTextContent('Granted Jan 27, 2026')
    expect(navigation?.querySelector('time')).toHaveAttribute('datetime', '2026-01-27')
    expect(navigation).toHaveTextContent('Methods and a system for in-store navigation')
    expect(navigation).toHaveTextContent('US 12,536,579 B2')
    expect(navigation).toHaveTextContent('NCR Voyix Corp')
    expect(navigation).toHaveTextContent('With Christian Lee McDaniel')
    expect(navigation?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US12536579B2/en',
    )
    expect(identity).toHaveTextContent('Granted Jul 8, 2025')
    expect(identity).toHaveTextContent('US 12,354,083 B2')
    expect(identity).toHaveTextContent(
      'Self-sovereign identity structured messaging for cross channel authentication',
    )
    expect(identity).toHaveTextContent('Digital First Holdings LLC')
    expect(identity).toHaveTextContent('With Bryan Walser Nonni')
    expect(identity?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US12354083B2/en',
    )
  })

  it('lists the pending application after them, labelled as an application', () => {
    const section = renderSection()
    const lists = section.getAllByRole('list')
    const applications = within(section.getByRole('list', { name: 'Applications' })).getAllByRole(
      'listitem',
    )
    const [consent] = applications

    expect(lists).toHaveLength(2)
    expect(lists[1]).toBe(section.getByRole('list', { name: 'Applications' }))
    expect(applications).toHaveLength(1)
    expect(consent).toHaveTextContent('Filed Oct 14, 2022')
    expect(consent).toHaveTextContent('Application US 2023/0032782 A1')
    expect(consent).toHaveTextContent('Pending')
    expect(consent).toHaveTextContent(
      'Self-Sovereign Identity Verifiable Credentials for Consent Processing',
    )
    expect(consent).toHaveTextContent('NCR Corp')
    expect(consent).not.toHaveTextContent(/granted/i)
    expect(consent?.querySelector('a')).toHaveAttribute(
      'href',
      'https://patents.google.com/patent/US20230032782A1/en',
    )
  })

  it('names each link for the filing it belongs to', () => {
    renderSection()

    expect(
      screen.getByRole('link', {
        name: 'Google Patents: Methods and a system for in-store navigation',
      }),
    ).toBeInTheDocument()
  })

  it('does not show the abandoned application', () => {
    renderSection()
    const text = screen.getByRole('region', { name: 'Patents' }).textContent

    expect(text).not.toMatch(/abandoned|non-fungible|2024\/0037539/i)
    expect(screen.queryByRole('link', { name: /non-fungible/i })).toBeNull()
  })

  it('never calls the filings four patents', () => {
    renderSection()
    const text = screen.getByRole('region', { name: 'Patents' }).textContent

    expect(text).not.toMatch(/\b(four|4|three|3) patents\b/i)
  })

  it('shows the abandoned application, labelled as abandoned, once its flag is flipped', () => {
    const section = renderSection(content.patents.map((patent) => ({ ...patent, shown: true })))
    const applications = within(section.getByRole('list', { name: 'Applications' })).getAllByRole(
      'listitem',
    )

    expect(applications).toHaveLength(2)
    expect(applications[1]).toHaveTextContent('Application US 2024/0037539 A1')
    expect(applications[1]).toHaveTextContent('Abandoned')
    expect(applications[1]).toHaveTextContent('With Bryan Walser Nonni and Brent Vance Zucker')
  })

  it('leaves out the applications heading when there is no application to show', () => {
    const section = renderSection(
      content.patents.filter((patent) => patent.status.kind === 'granted'),
    )

    expect(section.queryByRole('list', { name: 'Applications' })).toBeNull()
    expect(section.queryByRole('heading', { name: 'Applications' })).toBeNull()
  })

  it('leaves out the granted list when nothing has been granted', () => {
    const section = renderSection(
      content.patents.filter((patent) => patent.status.kind === 'pending'),
    )

    expect(section.queryByRole('list', { name: 'Patents granted' })).toBeNull()
    expect(section.getAllByRole('listitem')).toHaveLength(1)
  })
})
