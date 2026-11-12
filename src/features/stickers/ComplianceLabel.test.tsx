import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssetTag } from './AssetTag'
import { ComplianceLabel } from './ComplianceLabel'
import styles from './ComplianceLabel.module.css'
import metal from './metal.module.css'

const HEADING = 'U.S. PATENT FILINGS'
const NUMBERS = ['12,536,579', '12,354,083', '2023/0032782', '2024/0037539']

/** What each element of a class prints, in the order of the markup. */
function printed(container: HTMLElement, className: string | undefined): readonly string[] {
  return [...container.querySelectorAll(`.${className ?? ''}`)].map((element) =>
    element.textContent.trim(),
  )
}

describe('ComplianceLabel', () => {
  it('prints the heading, then every number in the order it is given', () => {
    const { container } = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />)

    expect(container).toHaveTextContent(
      /^U\.S\. PATENT FILINGS 12,536,579 · 12,354,083 2023\/0032782 · 2024\/0037539$/,
    )
  })

  it('sets the numbers two to a group, so that they stand in pairs', () => {
    const { container } = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />)

    expect(printed(container, styles.group)).toEqual([
      '12,536,579 · 12,354,083',
      '2023/0032782 · 2024/0037539',
    ])
  })

  it('leaves an odd number in a group of its own, with no separator after it', () => {
    const { container } = render(
      <ComplianceLabel heading={HEADING} numbers={NUMBERS.slice(0, -1)} />,
    )

    expect(printed(container, styles.group)).toEqual(['12,536,579 · 12,354,083', '2023/0032782'])
  })

  it('prints a single number without a separator', () => {
    const { container } = render(
      <ComplianceLabel heading="U.S. PATENT FILING" numbers={['12,354,083']} />,
    )

    expect(container).toHaveTextContent(/^U\.S\. PATENT FILING 12,354,083$/)
  })

  it('never breaks a number or the heading across lines', () => {
    const { container } = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />)

    expect(printed(container, styles.run)).toEqual([HEADING, ...NUMBERS])
  })

  it('has no line for a status: the heading and the numbers are all it prints', () => {
    const { container } = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />)

    expect(container.textContent).not.toMatch(/grant|pending|abandon/i)
    expect(container.querySelectorAll('span:empty')).toHaveLength(0)
  })

  it('is cut from the same brushed metal as the asset tag', () => {
    const label = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />).container
      .firstElementChild
    const tag = render(<AssetTag kicker="The serious version" label="Plain CV" />).container
      .firstElementChild

    expect(metal.brushed).toBeTruthy()
    expect(label).toHaveClass(metal.brushed ?? '')
    expect(tag).toHaveClass(metal.brushed ?? '')
  })

  it('is plain text: no drawing, no inline style, nothing hidden', () => {
    const { container } = render(<ComplianceLabel heading={HEADING} numbers={NUMBERS} />)

    expect(container.querySelector('svg, [style], [aria-hidden]')).toBeNull()
  })
})
