import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Education } from '../../../content'
import { workCopy } from './copy'
import { PermitTag } from './PermitTag'

function auburn(): Education {
  const [school] = content.education
  if (!school) {
    throw new Error('The record has no school')
  }
  return school
}

function renderPermit(school: Education = auburn()): HTMLElement {
  render(<PermitTag school={school} />)
  return screen.getByRole('article')
}

describe('PermitTag', () => {
  it('is an article headed by the university', () => {
    const permit = renderPermit()
    const heading = within(permit).getByRole('heading', { level: 3 })

    expect(permit).toHaveAttribute('data-school', 'auburn-university')
    expect(heading).toHaveTextContent('Auburn University')
    expect(heading).toHaveTextContent(workCopy.permit.kind)
    expect(permit).toHaveAccessibleName(heading.textContent)
  })

  it('prints the years the record gives', () => {
    const permit = renderPermit()
    const years = within(permit).getByText('2018 – 2021')

    expect(years.tagName).toBe('TIME')
    expect(years).toHaveAttribute('datetime', '2018')
    expect(years.parentElement).toHaveTextContent(/^Valid 2018 – 2021$/)
  })

  it('prints the subject and the level as the record words them', () => {
    const permit = renderPermit()

    expect(within(permit).getByText('Software Engineering')).toBeInTheDocument()
    expect(within(permit).getByText('Undergraduate')).toBeInTheDocument()
    expect(within(permit).getByText(workCopy.permit.subject).tagName).toBe('DT')
    expect(within(permit).getByText('Software Engineering').tagName).toBe('DD')
  })

  it('claims no degree and no graduation', () => {
    const permit = renderPermit()

    // “Undergraduate” is the level the record gives. It is not a claim to have graduated.
    expect(permit.textContent).not.toMatch(/degree|\bgraduat|bachelor|\bB\.?S\.?\b|alum/i)
  })

  it('says only when he began when the record has no last year', () => {
    const permit = renderPermit({ ...auburn(), end: null })

    expect(within(permit).getByText('2018').parentElement).toHaveTextContent(/^From 2018$/)
  })

  it('prints no years at all when the record has none', () => {
    const permit = renderPermit({ ...auburn(), start: null, end: null })

    expect(permit.querySelector('time')).toBeNull()
    expect(permit).not.toHaveTextContent(workCopy.permit.valid)
  })

  it('carries no inline style', () => {
    expect(renderPermit().querySelector('[style]')).toBeNull()
  })
})
