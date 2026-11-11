import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Experience } from '../../../content'
import { workCopy } from './copy'
import { JobTag } from './JobTag'

function role(id: string): Experience {
  const found = content.experience.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No job has the id "${id}"`)
  }
  return found
}

function renderTag(id: string, assetNumber = 4): HTMLElement {
  render(<JobTag job={{ role: role(id), assetNumber }} barcode="AL-0004" />)
  return screen.getByRole('article')
}

describe('JobTag', () => {
  it('is an article headed by whose property he was, and as what', () => {
    const tag = renderTag('fedi')
    const heading = within(tag).getByRole('heading', { level: 3 })

    expect(tag).toHaveAttribute('data-job', 'fedi')
    expect(tag).toHaveAccessibleName(heading.textContent)
    expect(heading).toHaveTextContent(/^Property of Fedi Senior Software Engineer$/)
  })

  it('prints when the job began, to the month, and nothing about when it ended', () => {
    const tag = renderTag('fedi')
    const began = within(tag).getByText('March 2024')

    expect(began.tagName).toBe('TIME')
    expect(began).toHaveAttribute('datetime', '2024-03')
    expect(began.parentElement).toHaveTextContent(/^From March 2024$/)
    expect(tag.querySelectorAll('time')).toHaveLength(1)
    expect(tag.textContent).not.toMatch(/–|—|\bto\b|until|present/i)
  })

  it('prints his own line about the job, in his handwriting', () => {
    const tag = renderTag('blockspaces', 2)

    expect(within(tag).getByText('My first exposure to the start-up world')).toHaveAttribute(
      'data-words',
    )
  })

  it('prints the team where the record has one, and no line of his where it has none', () => {
    const tag = renderTag('ncr', 1)

    expect(within(tag).getByText('Software Innovation Lab')).toBeInTheDocument()
    expect(tag.querySelector('[data-words]')).toBeNull()
    expect(renderTagAgain('zion').querySelector('[data-team]')).toBeNull()
  })

  it('numbers the asset, and draws the number as a barcode for the eye only', () => {
    const tag = renderTag('fedi', 4)

    expect(within(tag).getByText('0004').parentElement).toHaveTextContent(/^Asset no\. 0004$/)
    expect(tag.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(tag.querySelectorAll('svg rect').length).toBeGreaterThan(0)
  })

  it('marks the current job as in service, with no date when none is recorded', () => {
    const tag = renderTag('finite-computer', 5)

    expect(tag).toHaveAttribute('data-current')
    expect(within(tag).getByText(workCopy.tag.currentNote)).toBeInTheDocument()
    expect(tag).toHaveTextContent('In service')
    expect(tag.querySelector('time')).toBeNull()
    expect(tag.textContent).not.toMatch(/From/)
    expect(tag.textContent).not.toMatch(/\b20\d\d\b/)
  })

  it('still prints the date of a current job once the record has one', () => {
    const dated = { ...role('finite-computer'), start: { year: 2025, month: 6, day: null } }
    render(<JobTag job={{ role: dated, assetNumber: 5 }} barcode="AL-0005" />)

    const tag = screen.getByRole('article')
    expect(tag).toHaveAttribute('data-current')
    expect(within(tag).getByText('June 2025')).toHaveAttribute('datetime', '2025-06')
  })

  it('leaves a past job unmarked', () => {
    const tag = renderTag('fedi')

    expect(tag).not.toHaveAttribute('data-current')
    expect(tag).not.toHaveTextContent('In service')
  })

  it('carries no inline style and no line break', () => {
    const tag = renderTag('fedi')

    expect(tag.querySelector('[style], br')).toBeNull()
  })
})

/** A second tag in the same document, for comparing two jobs. */
function renderTagAgain(id: string): HTMLElement {
  const { container } = render(
    <JobTag job={{ role: role(id), assetNumber: 3 }} barcode="AL-0003" />,
  )
  const tag = container.querySelector('article')
  if (!tag) {
    throw new Error('Expected a tag')
  }
  return tag
}
