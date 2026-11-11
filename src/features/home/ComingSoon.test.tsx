import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { copy } from '../../content/copy'
import { PATHS } from '../../lib/paths'
import { ComingSoon } from './ComingSoon'

describe('ComingSoon', () => {
  it('says the lid is coming in the one h1', () => {
    render(<ComingSoon />)

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(copy.placeholder.title)
    expect(copy.placeholder.title).toMatch(/lid/i)
  })

  it('links to the CV', () => {
    render(<ComingSoon />)

    expect(screen.getByRole('link', { name: copy.placeholder.cvLink })).toHaveAttribute(
      'href',
      PATHS.cv,
    )
  })

  it('wraps the page in a main landmark', () => {
    render(<ComingSoon />)

    expect(screen.getByRole('main')).toHaveTextContent(copy.placeholder.body)
  })
})
