import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Barcode } from './Barcode'
import { code39 } from './geometry/code39'

describe('Barcode', () => {
  it('draws one bar for each bar of the code', () => {
    const { container } = render(<Barcode text="AL-0004" />)

    expect(container.querySelectorAll('rect')).toHaveLength(code39('AL-0004').bars.length)
  })

  it('is a drawing for the eye only: what it says is printed beside it', () => {
    const { container } = render(<Barcode text="AL-0004" />)
    const drawing = container.querySelector('svg')

    expect(drawing).toHaveAttribute('aria-hidden', 'true')
    expect(drawing).toHaveAttribute('focusable', 'false')
    expect(container.textContent).toBe('')
  })

  it('stretches to whatever box it is given', () => {
    const { container } = render(<Barcode text="A1" className="strip" />)
    const drawing = container.querySelector('svg')

    expect(drawing).toHaveAttribute('preserveAspectRatio', 'none')
    expect(drawing?.getAttribute('viewBox')).toMatch(
      new RegExp(`^0 0 ${String(code39('A1').width)} \\d+$`),
    )
    expect(drawing).toHaveClass('strip')
  })

  it('carries no inline style', () => {
    const { container } = render(<Barcode text="A1" />)

    expect(container.querySelector('[style]')).toBeNull()
  })
})
