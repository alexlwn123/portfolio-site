import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CraftKnife } from './CraftKnife'
import { MatRuler, RULER_MARKS } from './MatRuler'
import { Offcuts } from './Offcuts'

describe('MatRuler', () => {
  it('numbers the mat’s heavy lines from nought, along one edge', () => {
    const { container } = render(<MatRuler edge="top" />)
    const marks = [...container.querySelectorAll('[data-mark]')].map((mark) => mark.textContent)

    expect(marks).toHaveLength(RULER_MARKS)
    expect(marks.slice(0, 3)).toEqual(['0', '1', '2'])
    expect(container.firstElementChild).toHaveAttribute('data-edge', 'top')
  })

  it('is furniture: hidden from a screen reader', () => {
    const { container } = render(<MatRuler edge="left" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).toHaveAttribute('data-mat-prop', 'ruler')
    expect(container.firstElementChild).toHaveAttribute('data-edge', 'left')
    expect(container.querySelector('[style]')).toBeNull()
  })
})

describe.each([
  ['CraftKnife', <CraftKnife key="knife" note="cut here" className="lying" />, 'knife', 'cut here'],
  [
    'Offcuts',
    <Offcuts key="offcuts" note="weeded bits" className="lying" />,
    'offcuts',
    'weeded bits',
  ],
])('%s', (_, prop, name, note) => {
  it('is a drawing with a scribble beside it, all of it hidden from a screen reader', () => {
    const { container } = render(prop)
    const root = container.firstElementChild

    expect(root).toHaveAttribute('aria-hidden', 'true')
    expect(root).toHaveAttribute('data-mat-prop', name)
    expect(root?.querySelector('svg')).toHaveAttribute('focusable', 'false')
    expect(root).toHaveTextContent(note)
    expect(container.querySelector('[style]')).toBeNull()
  })

  it('is a list item, so that it can lie among the stickers, and takes a class for where', () => {
    const { container } = render(<ul>{prop}</ul>)
    const item = container.querySelector('[data-mat-prop]')

    expect(item?.tagName).toBe('LI')
    expect(item).toHaveClass('lying')
  })
})

describe('Offcuts, swept to the end of the last row', () => {
  it('says where they lie when told', () => {
    const { container } = render(
      <ul>
        <Offcuts
          note="weeded bits"
          place={{
            laptop: { row: 4, span: 4, place: 'last' },
            tablet: { row: 7, span: 3, place: 'last' },
          }}
        />
      </ul>,
    )
    const item = container.querySelector('[data-mat-prop="offcuts"]')

    expect(item).toHaveAttribute('data-span', '4')
    expect(item).toHaveAttribute('data-place', 'last')
    expect(item).toHaveAttribute('data-span-tablet', '3')
    expect(item).toHaveAttribute('data-place-tablet', 'last')
  })
})
