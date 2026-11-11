import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import voice from '../stickers/voice.module.css'
import { HeadingLabel } from './HeadingLabel'

describe('HeadingLabel', () => {
  it('shouts the title over two lines, each ending in a space and neither in a line break', () => {
    const { container } = render(<HeadingLabel lines={['Stuck on', 'so far']} />)

    expect(container.textContent).toBe('Stuck on so far ')
    expect(container.querySelector('br')).toBeNull()
    expect(container.querySelector(`.${voice.display ?? ''}`)).not.toBeNull()
  })

  it('leaves an empty line out', () => {
    const { container } = render(<HeadingLabel lines={['Wins', '']} />)

    expect(container.textContent).toBe('Wins ')
  })

  it('is phrasing content, so it can be the face of a heading', () => {
    const { container } = render(<HeadingLabel lines={['Career', 'path']} />)

    expect(container.querySelector('div, p')).toBeNull()
  })
})
