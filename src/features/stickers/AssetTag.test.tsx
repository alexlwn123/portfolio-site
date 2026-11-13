import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssetTag } from './AssetTag'
import metal from './metal.module.css'

describe('AssetTag', () => {
  it('prints the small line and the label', () => {
    const { container } = render(<AssetTag kicker="The serious version" label="Plain CV" />)

    expect(container).toHaveTextContent('The serious version')
    expect(container).toHaveTextContent('Plain CV')
  })

  it('draws its arrow and its barcode for the eye only', () => {
    const { container } = render(<AssetTag kicker="The serious version" label="Plain CV" />)

    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/[←-⇿]/)
  })

  it('is cut from brushed metal', () => {
    const { container } = render(<AssetTag kicker="The serious version" label="Plain CV" />)

    expect(container.firstElementChild).toHaveClass(metal.brushed ?? '')
  })
})
