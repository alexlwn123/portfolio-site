import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { patentsCopy } from './copy'
import { InspectionStickers } from './InspectionStickers'

describe('InspectionStickers', () => {
  it('is a short list of made-up stickers, none of them a link', () => {
    render(<InspectionStickers initials="AL" />)

    const list = screen.getByRole('list', { name: patentsCopy.stickers.list })
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    expect(within(list).queryByRole('link')).toBeNull()
  })

  it('passes quality control in his own hand, signed with his initials', () => {
    render(<InspectionStickers initials="AL" />)

    const quality = screen.getByText(patentsCopy.stickers.quality.verdict).closest('li')
    expect(quality).toHaveTextContent(/^QC passed AL$/)
    expect(quality?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('seals him as a named inventor, which the record says he is', () => {
    render(<InspectionStickers initials="AL" />)

    expect(screen.getByText(patentsCopy.stickers.seal.word).closest('li')).toHaveTextContent(
      /^Named Inventor$/,
    )
  })

  it('cautions that what is inside is novel, useful and non-obvious', () => {
    render(<InspectionStickers initials="AL" />)

    expect(screen.getByText(patentsCopy.stickers.caution.head).closest('li')).toHaveTextContent(
      /^Caution Novel\. Useful\. Non-obvious\.$/,
    )
  })

  it('imitates no regulatory mark and types no tick', () => {
    const { container } = render(<InspectionStickers initials="AL" />)

    expect(container.textContent).not.toMatch(/\b(CE|FCC|UL|RoHS|UKCA)\b|[✓✔]/)
    expect(container.querySelector('[style]')).toBeNull()
  })
})
