import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { ReturnLabel } from './ReturnLabel'

function renderLabel(): HTMLElement {
  const { container } = render(<ReturnLabel profile={content.profile} />)
  const label = container.querySelector<HTMLElement>('[data-return-label]')
  if (!label) {
    throw new Error('Expected a label')
  }
  return label
}

describe('ReturnLabel', () => {
  it('is addressed to him, by name, in his city, and says nothing before that', () => {
    const label = renderLabel()

    expect(label).toHaveTextContent(/^Alex Lewin Atlanta, GA/)
    expect(within(label).getByText(content.profile.name)).toBeInTheDocument()
  })

  it('is the address and nothing else: no plea to be returned, no reward', () => {
    const label = renderLabel()

    expect(label).not.toHaveTextContent(/if found|return to|reward/i)
    expect(label.querySelectorAll('p')).toHaveLength(0)
    expect(label.textContent.trim()).toMatch(new RegExp(`${content.profile.email}$`))
  })

  it('holds his contact details in an address element', () => {
    const address = renderLabel().querySelector('address')

    expect(address).toHaveTextContent(content.profile.name)
    expect(address).toHaveTextContent('Atlanta, GA')
    expect(address).toHaveTextContent(content.profile.email)
  })

  it('prints the work address from the profile as the one link, a mailto', () => {
    const label = renderLabel()
    const link = within(label).getByRole('link')

    expect(link).toHaveAttribute('href', `mailto:${content.profile.email}`)
    expect(link).toHaveAccessibleName(`Write to ${content.profile.email}`)
    expect(within(link).getByText(content.profile.email)).toBeInTheDocument()
    expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('prints no other address', () => {
    const addresses = renderLabel().textContent.match(/[\w.+-]+@[\w.-]+/g)

    expect(addresses).toEqual([content.profile.email])
  })

  it('carries no heading of its own, no inline style and no line break', () => {
    const label = renderLabel()

    expect(within(label).queryByRole('heading')).toBeNull()
    expect(label.querySelector('[style], br')).toBeNull()
  })
})
