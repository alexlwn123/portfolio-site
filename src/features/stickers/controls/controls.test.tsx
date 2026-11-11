import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import tones from '../tones.module.css'
import { SoundFace } from './SoundFace'
import { WordsFace } from './WordsFace'

describe('SoundFace', () => {
  it('is a drawing, hidden from assistive technology: the button names it', () => {
    const { container } = render(<SoundFace />)
    const drawing = container.querySelector('svg')

    expect(drawing).toHaveAttribute('aria-hidden', 'true')
    expect(drawing).toHaveAttribute('focusable', 'false')
    expect(container.textContent).toBe('')
  })

  it('draws the waves and the cross, for the stylesheet to choose between', () => {
    const { container } = render(<SoundFace />)

    expect(container.querySelectorAll('g path')).toHaveLength(2)
    expect(container.querySelectorAll('svg > path')).toHaveLength(2)
  })
})

describe('WordsFace', () => {
  it('prints its words so that they read as one name', () => {
    const { container } = render(<WordsFace lines={['Tidy', 'the lid']} tone="white" />)

    expect(container).toHaveTextContent('Tidy the lid')
    expect(container.firstElementChild).toHaveClass(tones.white ?? '')
    expect(container.querySelector('br')).toBeNull()
  })

  it('makes do with one word', () => {
    const { container } = render(<WordsFace lines={['Tilt']} tone="hi" />)

    expect(container.textContent.trim()).toBe('Tilt')
  })
})
