import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssetTag } from './AssetTag'
import { ComplianceLabel } from './ComplianceLabel'
import styles from './ComplianceLabel.module.css'
import metal from './metal.module.css'

const NUMBERS = ['12,354,083', '12,536,579']

describe('ComplianceLabel', () => {
  it('prints the patent numbers after their heading, then the line about pending ones', () => {
    const { container } = render(
      <ComplianceLabel
        heading="U.S. PAT. NOS."
        numbers={NUMBERS}
        pending="OTHER PATENTS PENDING"
      />,
    )

    expect(container).toHaveTextContent(
      /^U\.S\. PAT\. NOS\. 12,354,083 · 12,536,579 OTHER PATENTS PENDING$/,
    )
  })

  it('leaves the pending line out when nothing is pending', () => {
    const { container } = render(
      <ComplianceLabel heading="U.S. PAT. NOS." numbers={NUMBERS} pending={null} />,
    )

    expect(container).toHaveTextContent(/^U\.S\. PAT\. NOS\. 12,354,083 · 12,536,579$/)
    expect(container.querySelectorAll('span:empty')).toHaveLength(0)
  })

  it('prints a single number without a separator', () => {
    const { container } = render(
      <ComplianceLabel heading="U.S. PAT. NO." numbers={['12,354,083']} pending={null} />,
    )

    expect(container).toHaveTextContent(/^U\.S\. PAT\. NO\. 12,354,083$/)
  })

  it('never breaks a number or the heading across lines', () => {
    const { container } = render(
      <ComplianceLabel
        heading="U.S. PAT. NOS."
        numbers={NUMBERS}
        pending="OTHER PATENTS PENDING"
      />,
    )
    const runs = [...container.querySelectorAll(`.${styles.run ?? ''}`)].map((run) =>
      run.textContent.trim(),
    )

    expect(runs).toEqual(['U.S. PAT. NOS.', '12,354,083 · 12,536,579', 'OTHER PATENTS PENDING'])
  })

  it('is cut from the same brushed metal as the asset tag', () => {
    const label = render(
      <ComplianceLabel heading="U.S. PAT. NOS." numbers={NUMBERS} pending={null} />,
    ).container.firstElementChild
    const tag = render(<AssetTag kicker="The serious version" label="Plain CV" />).container
      .firstElementChild

    expect(metal.brushed).toBeTruthy()
    expect(label).toHaveClass(metal.brushed ?? '')
    expect(tag).toHaveClass(metal.brushed ?? '')
  })

  it('is plain text: no drawing, no inline style, nothing hidden', () => {
    const { container } = render(
      <ComplianceLabel
        heading="U.S. PAT. NOS."
        numbers={NUMBERS}
        pending="OTHER PATENTS PENDING"
      />,
    )

    expect(container.querySelector('svg, [style], [aria-hidden]')).toBeNull()
  })
})
