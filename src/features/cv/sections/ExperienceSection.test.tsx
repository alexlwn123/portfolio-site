import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Experience } from '../../../content'
import { ExperienceSection } from './ExperienceSection'

const bare: Experience = {
  id: 'bare',
  organization: 'Example Org',
  title: 'Engineer',
  team: null,
  start: null,
  end: null,
  current: false,
  description: null,
}

describe('ExperienceSection', () => {
  it('lists every role with its organization and title', () => {
    render(<ExperienceSection experience={content.experience} />)

    const items = within(screen.getByRole('region', { name: 'Experience' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(content.experience.length)
    content.experience.forEach((role, index) => {
      expect(items[index]).toHaveTextContent(role.organization)
      expect(items[index]).toHaveTextContent(role.title)
    })
  })

  it('marks the current role and dates the others from their start', () => {
    render(<ExperienceSection experience={content.experience} />)
    const [current, fedi] = screen.getAllByRole('listitem')

    expect(current).toHaveTextContent('Current')
    expect(current?.querySelector('time')).toBeNull()
    expect(fedi).toHaveTextContent('From March 2024')
    expect(fedi?.querySelector('time')).toHaveAttribute('datetime', '2024-03')
  })

  it('shows the team when there is one', () => {
    render(<ExperienceSection experience={content.experience} />)

    expect(screen.getByText(/Software Innovation Lab/)).toBeInTheDocument()
  })

  it('renders nothing for unknown values', () => {
    render(<ExperienceSection experience={[bare]} />)
    const item = screen.getByRole('listitem')

    expect(item.querySelector('time')).toBeNull()
    expect(item).toHaveTextContent(/^Engineer\s*Example Org$/)
    expect(item.querySelectorAll('p:empty, div:empty, span:empty')).toHaveLength(0)
  })

  it('never claims an end date', () => {
    render(<ExperienceSection experience={content.experience} />)

    expect(screen.getByRole('region')).not.toHaveTextContent(/present|–|to \d{4}/i)
  })
})
