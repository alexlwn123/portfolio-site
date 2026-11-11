import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { sectionAnchor } from '../sectionIds'
import { WinFlag } from './WinFlag'

const flag = { result: '1st', event: 'SatsxSW 2022', href: sectionAnchor('wins') }

describe('WinFlag', () => {
  it('is a link to the wins, named for the project, the result and the event', () => {
    render(<WinFlag owner="Pleb FM" flag={flag} />)

    // jsdom's name computation drops the space that follows the owner.
    const link = screen.getByRole('link', { name: /^Pleb FM:\s*1st\s+SatsxSW 2022$/ })
    expect(link).toHaveAttribute('href', '/#wins')
  })

  it('prints the result and the event, and only reads out whose win it is', () => {
    const { container } = render(<WinFlag owner="Pleb FM" flag={flag} />)

    expect(screen.getByText('1st')).toBeVisible()
    expect(screen.getByText('SatsxSW 2022')).toBeVisible()
    expect(container.querySelector('[style]')).toBeNull()
    expect(container.textContent).toMatch(/^Pleb FM:\s+1st\s+SatsxSW 2022\s*$/)
  })

  it('takes a class for where it is pinned', () => {
    render(<WinFlag owner="Pleb FM" flag={flag} className="pinned" />)

    expect(screen.getByRole('link')).toHaveClass('pinned')
  })
})
