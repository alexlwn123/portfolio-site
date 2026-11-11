import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Cue } from './Cue'

describe('Cue', () => {
  it('writes the words and draws the arrow after them, for the eye only', () => {
    const { container } = render(<Cue text="scroll, it gets stickier" />)
    const arrow = container.querySelector('svg')

    expect(container).toHaveTextContent('scroll, it gets stickier')
    expect(arrow).toHaveAttribute('aria-hidden', 'true')
    expect(container.textContent).not.toMatch(/[←-⇿]/)
    expect(container.firstElementChild?.lastElementChild).toBe(arrow)
  })

  it('is phrasing content: it sits inside the link that leads down the page', () => {
    const { container } = render(<Cue text="scroll" />)

    expect(container.querySelector('div, p')).toBeNull()
    expect(container.firstElementChild?.tagName).toBe('SPAN')
  })
})
