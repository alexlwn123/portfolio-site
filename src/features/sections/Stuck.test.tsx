import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Stuck } from './Stuck'
import styles from './Stuck.module.css'

describe('Stuck', () => {
  it('is a plain block with a sticker’s shadow', () => {
    render(<Stuck>Asset tag</Stuck>)

    const stuck = screen.getByText('Asset tag')
    expect(stuck.tagName).toBe('DIV')
    expect(stuck).toHaveClass(styles.stuck ?? '')
    expect(stuck).not.toHaveAttribute('href')
  })

  it('is a link when it leads somewhere, with a name when its face is a drawing', () => {
    render(
      <Stuck href="https://pleb.fm" label="Pleb FM">
        <svg />
      </Stuck>,
    )

    const link = screen.getByRole('link', { name: 'Pleb FM' })
    expect(link).toHaveAttribute('href', 'https://pleb.fm')
    expect(link).toHaveClass(styles.stuck ?? '', styles.lifts ?? '')
  })

  it('can be another element, and takes a class for where and how it sits', () => {
    render(
      <Stuck as="li" className="tilted">
        One of a list
      </Stuck>,
    )

    const item = screen.getByText('One of a list')
    expect(item.tagName).toBe('LI')
    expect(item).toHaveClass(styles.stuck ?? '', 'tilted')
    expect(item).not.toHaveClass(styles.lifts ?? '')
  })
})
