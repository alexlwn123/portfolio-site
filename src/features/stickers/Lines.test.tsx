import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Lines } from './Lines'

describe('Lines', () => {
  it('sets each item on its own line, without a line-break element', () => {
    const { container } = render(<Lines lines={['Lightning jukebox', '1st · SatsxSW 2022']} />)

    expect(container.querySelectorAll('span')).toHaveLength(2)
    expect(container.querySelector('br')).toBeNull()
  })

  it('keeps the words of neighbouring lines apart when read out', () => {
    const { container } = render(<Lines lines={['HOW TO WIN', 'EVERY HACKATHON']} />)

    expect(container.textContent).toBe('HOW TO WIN EVERY HACKATHON ')
  })

  it('leaves out an empty line', () => {
    const { container } = render(<Lines lines={['Hackathon', '']} />)

    expect(container.querySelectorAll('span')).toHaveLength(1)
  })
})
