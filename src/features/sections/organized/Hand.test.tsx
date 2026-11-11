import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { organizedCopy } from './copy'
import { Hand } from './Hand'

const STAMP = { role: 'ORGANIZER', since: 'SINCE 2020' }

describe('Hand', () => {
  it('is an image that says what the stamp says', () => {
    render(<Hand stamp={STAMP} />)

    const hand = screen.getByRole('img')
    expect(hand).toHaveAccessibleName(organizedCopy.hand('ORGANIZER SINCE 2020'))
    expect(hand.tagName.toLowerCase()).toBe('svg')
  })

  it('letters the stamp on two lines, from what it is given', () => {
    const { container } = render(<Hand stamp={STAMP} />)
    const lines = [...container.querySelectorAll('text')].map((line) => line.textContent)

    expect(lines).toEqual(['ORGANIZER', 'SINCE 2020'])
  })

  it('draws the stamp’s stars: the typefaces have none', () => {
    const { container } = render(<Hand stamp={STAMP} />)

    expect(container.textContent).not.toMatch(/[✦★☆]/)
    expect(container.querySelectorAll('[data-stamp] path').length).toBeGreaterThanOrEqual(2)
  })

  it('stamps the role alone before there is a first year', () => {
    const { container } = render(<Hand stamp={{ role: 'ORGANIZER', since: null }} />)
    const lines = [...container.querySelectorAll('text')].map((line) => line.textContent)

    expect(lines).toEqual(['ORGANIZER'])
    expect(screen.getByRole('img')).toHaveAccessibleName(organizedCopy.hand('ORGANIZER'))
  })

  it('builds the hand once and draws it three times: the cut, the edge and the skin', () => {
    const { container } = render(<Hand stamp={STAMP} />)
    const shape = container.querySelector('defs g')

    expect(shape?.id).toBe('organized-hand-shape')
    expect(container.querySelectorAll('use[href="#organized-hand-shape"]')).toHaveLength(3)
  })
})
