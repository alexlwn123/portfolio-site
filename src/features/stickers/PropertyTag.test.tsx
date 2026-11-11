import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import metal from './metal.module.css'
import { PropertyTag } from './PropertyTag'
import styles from './PropertyTag.module.css'

const fedi = { kicker: 'Property of', organization: 'Fedi', issued: 'Issued 2024' } as const

describe('PropertyTag', () => {
  it('prints whose property it is and when the tag was issued, as words a reader can follow', () => {
    const { container } = render(<PropertyTag {...fedi} cut="label" />)

    expect(container.textContent).toBe('Property of Fedi Issued 2024')
  })

  it('leaves the last line off when there is nothing to print on it', () => {
    const { container } = render(
      <PropertyTag kicker="Property of" organization="Finite Computer" issued={null} cut="plate" />,
    )

    expect(container.textContent.trim()).toBe('Property of Finite Computer')
    expect(container.querySelectorAll('[data-line]')).toHaveLength(2)
  })

  it.each(['plate', 'strip'] as const)('cuts a %s from brushed metal', (cut) => {
    const { container } = render(<PropertyTag {...fedi} cut={cut} />)

    expect(container.firstElementChild).toHaveClass(metal.brushed ?? '')
    expect(container.firstElementChild).toHaveClass(styles[cut] ?? '')
  })

  it('cuts a label from white paper', () => {
    const { container } = render(<PropertyTag {...fedi} cut="label" />)

    expect(container.firstElementChild).not.toHaveClass(metal.brushed ?? '')
    expect(container.firstElementChild).toHaveClass(styles.label ?? '')
    expect(styles.label).not.toBe(styles.plate)
  })

  it('draws a barcode on the plate alone, for the eye only', () => {
    const bars = (cut: 'plate' | 'label' | 'strip'): number =>
      render(<PropertyTag {...fedi} cut={cut} />).container.querySelectorAll('[aria-hidden="true"]')
        .length

    expect(bars('plate')).toBe(1)
    expect(bars('label')).toBe(0)
    expect(bars('strip')).toBe(0)
  })

  it('is phrasing content throughout, so it can be a link', () => {
    const { container } = render(<PropertyTag {...fedi} cut="plate" />)

    expect(container.querySelectorAll('div, p, ul')).toHaveLength(0)
  })
})
