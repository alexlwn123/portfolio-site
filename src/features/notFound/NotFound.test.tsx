import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { copy } from '../../content/copy'
import { PATHS } from '../../lib/paths'
import { NotFound } from './NotFound'

describe('NotFound', () => {
  it('names the problem in the one h1', () => {
    render(<NotFound />)

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(copy.notFound.title)
  })

  it('offers the way home and the CV', () => {
    render(<NotFound />)

    expect(screen.getByRole('link', { name: copy.notFound.homeLink })).toHaveAttribute(
      'href',
      PATHS.home,
    )
    expect(screen.getByRole('link', { name: copy.notFound.cvLink })).toHaveAttribute(
      'href',
      PATHS.cv,
    )
  })

  it('wraps the page in a main landmark', () => {
    render(<NotFound />)

    expect(screen.getByRole('main')).toHaveTextContent(copy.notFound.body)
  })
})
