import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HelloTag } from './HelloTag'

const TEXT =
  'software engineer from Atlanta, GA. I organize and compete in hackathons around the world.'

describe('HelloTag', () => {
  it('reads as one introduction: greeting, lead-in, then his own words', () => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" text={TEXT} highlight="hackathons" />,
    )

    expect(container).toHaveTextContent(`HELLO I’m a ${TEXT}`)
    expect(container.querySelectorAll('p')).toHaveLength(1)
  })

  it('runs the highlighter over one word', () => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" text={TEXT} highlight="hackathons" />,
    )

    const marks = container.querySelectorAll('mark')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('hackathons')
  })

  it.each(['conferences', ''])('prints the text whole when "%s" is not in it', (highlight) => {
    const { container } = render(
      <HelloTag greeting="HELLO" lead="I’m a" text={TEXT} highlight={highlight} />,
    )

    expect(container.querySelector('mark')).toBeNull()
    expect(screen.getByText(TEXT)).toBeInTheDocument()
    expect(container).toHaveTextContent(`HELLO I’m a ${TEXT}`)
  })
})
