import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Scrawl } from './Scrawl'
import voice from './voice.module.css'

describe('Scrawl', () => {
  it('writes its line in his marker', () => {
    const { container } = render(<Scrawl text="the long versions are further down." />)

    expect(container).toHaveTextContent('the long versions are further down.')
    expect(container.firstElementChild).toHaveClass(voice.marker ?? '')
    expect(container.firstElementChild?.tagName).toBe('SPAN')
  })
})
