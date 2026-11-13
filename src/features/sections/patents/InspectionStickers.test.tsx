import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { patentsCopy } from './copy'
import { InspectionStickers } from './InspectionStickers'

describe('InspectionStickers', () => {
  it('is a short list of two stickers, neither of them a link', () => {
    render(<InspectionStickers initials="AL" />)

    const list = screen.getByRole('list', { name: patentsCopy.stickers.list })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).queryByRole('link')).toBeNull()
  })

  it('passes quality control in his own hand, signed with his initials', () => {
    render(<InspectionStickers initials="AL" />)

    const quality = screen.getByText(patentsCopy.stickers.quality.verdict).closest('li')
    expect(quality).toHaveTextContent(/^QC passed AL$/)
    expect(quality?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('sticks on a die-cut emoji, a picture with a name of its own', () => {
    render(<InspectionStickers initials="AL" />)

    const emoji = screen.getByRole('img', { name: patentsCopy.stickers.emoji.name })
    expect(emoji).toHaveTextContent(patentsCopy.stickers.emoji.glyph)
    expect(emoji.textContent).toBe('💡')
    expect(emoji.closest('li')).not.toBeNull()
    expect(emoji).toHaveAttribute('data-emoji')
  })

  it('comes first, where the seal was, with the quality check after it', () => {
    render(<InspectionStickers initials="AL" />)
    const [first, second] = screen.getAllByRole('listitem')

    expect(first).toContainElement(screen.getByRole('img'))
    expect(second).toHaveTextContent(/^QC passed AL$/)
  })

  it('seals nothing and cautions nothing: those two stickers are gone', () => {
    const { container } = render(<InspectionStickers initials="AL" />)

    expect(container.textContent).not.toMatch(/named|inventor|caution|novel|useful|non-obvious/i)
  })

  it('imitates no regulatory mark and types no tick', () => {
    const { container } = render(<InspectionStickers initials="AL" />)

    expect(container.textContent).not.toMatch(/\b(CE|FCC|UL|RoHS|UKCA)\b|[✓✔]/)
    expect(container.querySelector('[style]')).toBeNull()
  })
})
