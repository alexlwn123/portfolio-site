import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HelloTag } from './HelloTag'

const LINES = ['software engineer from Atlanta, GA.', 'I build AI agents at Finite Computer.']
const TEXT = LINES.join(' ')

describe('HelloTag', () => {
  it('reads as one introduction: greeting, lead-in, then his own words', () => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" lines={LINES} highlight="AI agents" />,
    )

    expect(container).toHaveTextContent(`HELLO I’m a ${TEXT}`)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('writes a sentence to a line, with no line break typed between them', () => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" lines={LINES} highlight="AI agents" />,
    )

    expect(screen.getByText(LINES[0] ?? '')).toBeInTheDocument()
    expect(container.querySelector('br')).toBeNull()
    // Each line ends in a space, so the two never run together when read out or copied.
    expect(screen.getByText(LINES[0] ?? '').textContent).toBe(`${LINES[0] ?? ''} `)
  })

  it('runs the highlighter over one phrase, once', () => {
    const twice = ['I build AI agents.', 'AI agents build me.']
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" lines={twice} highlight="AI agents" />,
    )

    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('AI agents')
    expect(marks[0]?.parentElement).toHaveTextContent('I build AI agents.')
  })

  it.each(['conferences', ''])('prints the text whole when "%s" is not in it', (highlight) => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" lines={LINES} highlight={highlight} />,
    )

    expect(container.querySelector('mark')).toBeNull()
    expect(container).toHaveTextContent(`HELLO I’m a ${TEXT}`)
  })
})
