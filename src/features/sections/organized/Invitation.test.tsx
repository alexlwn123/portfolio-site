import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { organizedCopy } from './copy'
import { Invitation } from './Invitation'

function renderInvitation(): HTMLElement {
  const { container } = render(<Invitation />)
  const invitation = container.querySelector<HTMLElement>('[data-invitation]')
  if (!invitation) {
    throw new Error('Expected an invitation')
  }
  return invitation
}

describe('Invitation', () => {
  it('asks whether the visitor wants a hackathon of their own, and says what he can do about it', () => {
    const invitation = renderInvitation()
    const { question, offer, action } = organizedCopy.invitation

    expect(invitation).toHaveTextContent(question)
    expect(invitation).toHaveTextContent(offer)
    expect(invitation).toHaveTextContent(action)
    expect(invitation.textContent.replace(/\s+/g, ' ').trim()).toBe(
      `${question} ${offer} ${action}`,
    )
  })

  it('is one link, the whole of it, to the contact section of this page', () => {
    const invitation = renderInvitation()
    const link = screen.getByRole('link')

    expect(invitation.querySelectorAll('a')).toHaveLength(1)
    expect(link).toHaveAttribute('href', '/#contact')
    expect(link).not.toHaveAttribute('target')
    expect(link).toHaveAccessibleName(
      `${organizedCopy.invitation.question} ${organizedCopy.invitation.offer} ${organizedCopy.invitation.action}`,
    )
  })

  it('is a sticker that lifts by its face, so the link under the pointer keeps its place', () => {
    renderInvitation()
    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('data-stuck')
    expect(link.querySelector(':scope > [data-stuck-face]')).not.toBeNull()
  })

  it('draws its arrow for the eye only, and types none', () => {
    const invitation = renderInvitation()

    expect(invitation.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(invitation.textContent).not.toMatch(/[←-⇿]/)
  })

  it('adds no heading, and carries no inline style', () => {
    const invitation = renderInvitation()

    expect(invitation.querySelector('h1, h2, h3, h4')).toBeNull()
    expect(invitation.querySelector('[style]')).toBeNull()
  })
})
