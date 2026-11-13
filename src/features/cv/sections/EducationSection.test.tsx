import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Education } from '../../../content'
import { EducationSection } from './EducationSection'

function firstEntry(): Education {
  const [entry] = content.education
  if (!entry) {
    throw new Error('Expected an education entry')
  }
  return entry
}

describe('EducationSection', () => {
  it('lists the institution, level and subject, and the years he was there', () => {
    render(<EducationSection education={content.education} />)
    const item = within(screen.getByRole('region', { name: 'Education' })).getByRole('listitem')

    expect(item).toHaveTextContent('Auburn University')
    expect(item).toHaveTextContent('Undergraduate, Software Engineering')
    expect(item).toHaveTextContent('August 2018 – 2021')
    expect(item.querySelector('time')).toHaveAttribute('datetime', '2018-08')
  })

  it('claims no graduation: the record gives a last year, not a degree', () => {
    render(<EducationSection education={content.education} />)

    expect(screen.getByRole('region')).not.toHaveTextContent(/\bgraduated\b|degree/i)
  })

  it('says only when it began when the last year is not recorded', () => {
    render(<EducationSection education={[{ ...firstEntry(), end: null }]} />)
    const item = screen.getByRole('listitem')

    expect(item).toHaveTextContent('Began August 2018')
    expect(item).not.toHaveTextContent('–')
  })

  it('shows a graduation date when one is recorded', () => {
    const graduated = { ...firstEntry(), graduated: { year: 2022, month: 5, day: null } }

    render(<EducationSection education={[graduated]} />)

    expect(screen.getByRole('listitem')).toHaveTextContent('Graduated May 2022')
  })

  it('renders no date at all when the start is unknown', () => {
    render(<EducationSection education={[{ ...firstEntry(), start: null }]} />)

    expect(screen.getByRole('listitem').querySelector('time')).toBeNull()
    expect(screen.getByRole('listitem')).not.toHaveTextContent(/began|2021/i)
  })
})
