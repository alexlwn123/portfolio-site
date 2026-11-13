import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Cue } from './Cue'
import styles from './Cue.module.css'

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

  it('is written loud unless it is told to be quiet', () => {
    const { container } = render(<Cue text="scroll" />)

    expect(container.firstElementChild).toHaveClass(styles.cue ?? '')
    expect(container.firstElementChild).not.toHaveClass(styles.quiet ?? '')
  })

  it('can be the quieter line beside it: the same hand, smaller, with an arrow that points on', () => {
    const { container } = render(<Cue text="contact me" quiet />)
    const words = container.firstElementChild
    const arrow = container.querySelector('svg')

    expect(words).toHaveClass(styles.cue ?? '', styles.quiet ?? '')
    expect(words).toHaveTextContent('contact me')
    expect(words?.lastElementChild).toBe(arrow)
    expect(arrow).toHaveAttribute('aria-hidden', 'true')
    // It points on, not down: the arrow is not the one the loud line draws.
    const down = render(<Cue text="scroll" />).container.querySelector('path')
    expect(arrow?.querySelector('path')?.getAttribute('d')).not.toBe(down?.getAttribute('d'))
  })
})
