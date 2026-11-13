import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SHARED_IDS } from '../../stickers/svgIds'
import { FoilNumber } from './FoilNumber'

describe('FoilNumber', () => {
  it('is a drawing: the number it shows is said in words beside it', () => {
    const { container } = render(<FoilNumber id="organized-count" figure="16" />)
    const drawing = container.querySelector('svg')

    expect(drawing).toHaveAttribute('aria-hidden', 'true')
    expect(drawing).toHaveAttribute('focusable', 'false')
  })

  it('letters the figure once, and stacks copies of it for the cut, the edge and the foil', () => {
    const { container } = render(<FoilNumber id="organized-count" figure="16" />)
    const letters = container.querySelectorAll('text')
    const copies = [...container.querySelectorAll('use')]

    expect(letters).toHaveLength(1)
    expect(letters[0]).toHaveTextContent('16')
    expect(letters[0]?.closest('defs')).not.toBeNull()
    expect(letters[0]?.id).toBe('organized-count-figure')
    expect(copies).toHaveLength(4)
    for (const copy of copies) {
      expect(copy).toHaveAttribute('href', '#organized-count-figure')
    }
    expect(copies.at(-1)).toHaveAttribute('fill', `url(#${SHARED_IDS.foil})`)
  })

  it('makes room for as many digits as it is given', () => {
    const width = (figure: string): number => {
      const { container } = render(<FoilNumber id={`n${figure}`} figure={figure} />)
      const [, , boxWidth] = (container.querySelector('svg')?.getAttribute('viewBox') ?? '').split(
        ' ',
      )
      return Number(boxWidth)
    }

    expect(width('16')).toBe(270)
    expect(width('9')).toBeLessThan(width('16'))
    expect(width('100')).toBeGreaterThan(width('16'))
  })
})
