import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { EducationSection } from './EducationSection'

describe('EducationSection', () => {
  it('lists the institution, level and subject, and when it began', () => {
    render(<EducationSection education={content.education} />)
    const item = within(screen.getByRole('region', { name: 'Education' })).getByRole('listitem')

    expect(item).toHaveTextContent('Auburn University')
    expect(item).toHaveTextContent('Undergraduate, Software Engineering')
    expect(item).toHaveTextContent('Began August 2018')
    expect(item.querySelector('time')).toHaveAttribute('datetime', '2018-08')
  })

  it('claims no graduation, because the year is not recorded', () => {
    render(<EducationSection education={content.education} />)

    expect(screen.getByRole('region')).not.toHaveTextContent(/graduat|degree|B\.?S\.?|–/i)
  })

  it('shows a graduation date when one is recorded', () => {
    const [entry] = content.education
    if (!entry) {
      throw new Error('Expected an education entry')
    }
    const graduated = { ...entry, graduated: { year: 2022, month: 5, day: null } }

    render(<EducationSection education={[graduated]} />)

    expect(screen.getByRole('listitem')).toHaveTextContent('Graduated May 2022')
  })

  it('renders no date at all when the start is unknown', () => {
    const [entry] = content.education
    if (!entry) {
      throw new Error('Expected an education entry')
    }

    render(<EducationSection education={[{ ...entry, start: null }]} />)

    expect(screen.getByRole('listitem').querySelector('time')).toBeNull()
    expect(screen.getByRole('listitem')).not.toHaveTextContent(/began/i)
  })
})
