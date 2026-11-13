import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import foil from './foil.module.css'
import tones from './tones.module.css'
import { Vinyl } from './Vinyl'
import styles from './Vinyl.module.css'

describe('Vinyl', () => {
  it('is flat and whole, in no particular colour, unless told otherwise', () => {
    render(<Vinyl>text</Vinyl>)

    const vinyl = screen.getByText('text')
    expect(vinyl.tagName).toBe('SPAN')
    expect(vinyl).toHaveClass(styles.vinyl ?? '')
    expect(vinyl.classList).toHaveLength(1)
    expect(vinyl).not.toHaveClass(styles.peel ?? '')
    expect(vinyl).not.toHaveClass(foil.foil ?? '')
  })

  it('takes a tone, foil and a peeling corner', () => {
    render(
      <Vinyl as="div" tone="hi" foil peel="topLeft">
        text
      </Vinyl>,
    )

    const vinyl = screen.getByText('text')
    expect(vinyl.tagName).toBe('DIV')
    expect(vinyl).toHaveClass(
      tones.hi ?? '',
      foil.foil ?? '',
      styles.peel ?? '',
      styles.peelTopLeft ?? '',
    )
  })

  it('peels from the bottom right by default', () => {
    render(<Vinyl peel="bottomRight">text</Vinyl>)

    expect(screen.getByText('text')).toHaveClass(styles.peel ?? '')
    expect(screen.getByText('text')).not.toHaveClass(styles.peelTopLeft ?? '')
  })
})
