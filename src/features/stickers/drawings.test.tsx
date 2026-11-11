import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DieCutText } from './DieCutText'
import { FOIL_REST, foilGradientTransform } from './geometry/foil'
import { MEDAL, medalRim } from './geometry/medal'
import { RING_ARCS, RING_STAR_ANGLES } from './geometry/ring'
import { starburstPoints, WINS_SEAL } from './geometry/starburst'
import { HexBadge } from './HexBadge'
import { ArcadeButton } from './illustrations/ArcadeButton'
import { Bolt } from './illustrations/Bolt'
import { Crab } from './illustrations/Crab'
import { ArrowDown, ArrowRight, Star } from './illustrations/Glyphs'
import { SharedDefs } from './illustrations/SharedDefs'
import { Medal } from './Medal'
import { RoundBadge } from './RoundBadge'
import { Starburst } from './Starburst'
import { SHARED_IDS } from './svgIds'
import { Tally } from './Tally'
import tones from './tones.module.css'

function texts(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('svg > text, svg > g > text, textPath')]
    .filter((node) => node.querySelector('textPath') === null)
    .map((node) => node.textContent)
}

function ids(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('[id]')].map(({ id }) => id)
}

describe('every drawing', () => {
  it.each([
    ['Star', <Star key="star" />],
    ['ArrowRight', <ArrowRight key="right" />],
    ['ArrowDown', <ArrowDown key="down" />],
    ['Bolt', <Bolt key="bolt" />],
    ['Crab', <Crab key="crab" id="crab" caption="clawthing.store" />],
    ['ArcadeButton', <ArcadeButton key="button" id="button" top="Last Pay Wins" bottom="2.5M+" />],
    ['DieCutText', <DieCutText key="name" id="name" lines={['Alex', 'Lewin']} />],
    ['Starburst', <Starburst key="burst" top="HACKATHON" figure="8×" bottom="WINNER" />],
    ['RoundBadge', <RoundBadge key="round" id="round" ring={['A', 'B']} figure="16" />],
    ['HexBadge', <HexBadge key="hex" kicker="1st" title={['Lightning']} foot="Berlin" />],
    [
      'Medal',
      <Medal key="medal" id="medal" rank="1st" lines={['OF 300+']} rim={['A', 'B']} tone="hi" />,
    ],
    ['Tally', <Tally key="tally" count={16} />],
    ['SharedDefs', <SharedDefs key="defs" />],
  ])('%s is hidden from assistive technology and cannot take focus', (_, drawing) => {
    const { container } = render(drawing)
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(container.querySelector('[style]')).toBeNull()
  })
})

describe('DieCutText', () => {
  const LETTERS = ['A', 'l', 'e', 'x', 'L', 'e', 'w', 'i', 'n']

  it('sets two lines a letter at a time, each letter a piece of its own', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const letters = [...container.querySelectorAll('defs text')]

    // The first line's last letter carries the space that parts the two lines when read out.
    expect(letters.map((letter) => letter.textContent.trim())).toEqual(LETTERS)
    expect(letters.map((letter) => letter.textContent).join('')).toBe('Alex Lewin')
    expect(letters.map(({ id }) => id)).toEqual([
      'name-letter-0-0',
      'name-letter-0-1',
      'name-letter-0-2',
      'name-letter-0-3',
      'name-letter-1-0',
      'name-letter-1-1',
      'name-letter-1-2',
      'name-letter-1-3',
      'name-letter-1-4',
    ])
    // The first line is set larger than the second, and each on its own baseline.
    expect(new Set(letters.slice(0, 4).map((letter) => letter.getAttribute('font-size')))).toEqual(
      new Set(['174']),
    )
    expect(new Set(letters.slice(4).map((letter) => letter.getAttribute('y')))).toEqual(
      new Set(['264']),
    )
  })

  it('places each letter itself, across the same measure on both lines', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const letters = [...container.querySelectorAll('defs text')]
    const starts = letters.map((letter) => Number(letter.getAttribute('x')))

    expect(starts[0]).toBe(27)
    expect(starts[4]).toBe(27)
    expect(starts.slice(0, 4)).toEqual(starts.slice(0, 4).toSorted((one, other) => one - other))
    expect(container.querySelector('[textLength]')).toBeNull()
  })

  it('stacks six copies of every letter: cut, shadow, edge and three fills', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const layers = [...container.querySelectorAll('svg > g[data-layer]')]

    expect(layers.map((layer) => layer.getAttribute('data-layer'))).toEqual([
      'cut',
      'shadow',
      'edge',
      'foil',
      'stripes',
      'glow',
    ])
    for (const layer of layers) {
      const uses = [...layer.querySelectorAll('use')]
      expect(uses.map((use) => use.getAttribute('href'))).toEqual(
        LETTERS.map(
          (_, index) =>
            `#name-letter-${index < 4 ? `0-${String(index)}` : `1-${String(index - 4)}`}`,
        ),
      )
    }
  })

  it('gives each letter its turn, the same turn in every layer, so its copies land as one', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const turnsOf = (layer: Element): readonly (string | null)[] =>
      [...layer.querySelectorAll('use')].map((use) => use.getAttribute('data-turn'))
    const [first, ...others] = [...container.querySelectorAll('svg > g[data-layer]')]

    expect(first && turnsOf(first)).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
    for (const layer of others) {
      expect(turnsOf(layer)).toEqual(first && turnsOf(first))
    }
  })

  it('is an image named for what it says, when it is given a label', () => {
    const { container } = render(
      <DieCutText id="name" lines={['Alex', 'Lewin']} label="Alex Lewin" />,
    )
    const svg = container.querySelector('svg')

    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).toHaveAccessibleName('Alex Lewin')
    expect(svg).not.toHaveAttribute('aria-hidden')
    expect(container.textContent).toBe('Alex Lewin')
  })

  it('names its definitions after the sticker and fills from the shared foil', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const fills = [...container.querySelectorAll('g[fill]')].map((layer) =>
      layer.getAttribute('fill'),
    )

    expect(ids(container).filter((id) => !id.startsWith('name-letter-'))).toEqual([
      'name-stripes',
      'name-glow',
      'name-shine',
      'name-outline',
    ])
    expect(fills).toEqual([`url(#${SHARED_IDS.foil})`, 'url(#name-stripes)', 'url(#name-glow)'])
  })

  it('has one pass of light ready to cross the foil, cut to the letters', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const light = container.querySelector('[data-light]')
    const outline = container.querySelector('clipPath')

    expect(light?.parentElement).toHaveAttribute('clip-path', 'url(#name-outline)')
    expect(light).toHaveAttribute('fill', 'url(#name-shine)')
    expect(outline?.querySelectorAll('use')).toHaveLength(LETTERS.length)
  })

  it('puts the hot spot where the foil rests', () => {
    const { container } = render(<DieCutText id="name" lines={['Alex', 'Lewin']} />)
    const glow = container.querySelector('radialGradient')

    expect(glow).toHaveAttribute('cx', '168')
    expect(glow).toHaveAttribute('cy', '90')
  })
})

describe('Starburst', () => {
  it('Starburst generates its points', () => {
    const { container } = render(<Starburst top="HACKATHON" figure="8×" bottom="WINNER" />)
    const points = container.querySelector('polygon')?.getAttribute('points') ?? ''

    expect(points).toBe(starburstPoints(WINS_SEAL))
    expect(points.split(' ')).toHaveLength(WINS_SEAL.spikes * 2)
  })

  it('takes another shape when given one', () => {
    const shape = { centre: 100, spikes: 6, outer: 90, inner: 60 }
    const { container } = render(<Starburst top="A" figure="1" bottom="B" shape={shape} />)

    expect(container.querySelector('polygon')?.getAttribute('points')?.split(' ')).toHaveLength(12)
  })

  it('letters the figure between its two words, with a copy behind it as a shadow', () => {
    const { container } = render(<Starburst top="HACKATHON" figure="8×" bottom="WINNER" />)

    expect(texts(container)).toEqual(['HACKATHON', '8×', '8×', 'WINNER'])
  })
})

describe('RoundBadge', () => {
  const badge = (
    <RoundBadge id="organized-count" ring={['HACKATHONS ORGANIZED', '8 COUNTRIES']} figure="16" />
  )

  it('sets each phrase on its own arc of the rim', () => {
    const { container } = render(badge)
    const arcs = [...container.querySelectorAll('textPath')]

    expect(arcs.map((arc) => arc.textContent)).toEqual(['HACKATHONS ORGANIZED', '8 COUNTRIES'])
    expect(arcs.map((arc) => arc.getAttribute('href'))).toEqual([
      '#organized-count-rim',
      '#organized-count-rim',
    ])
    expect(arcs.map((arc) => Number(arc.getAttribute('startOffset')))).toEqual(
      RING_ARCS.map(({ start }) => start),
    )
  })

  it('draws the stars between the phrases instead of typing them', () => {
    const { container } = render(badge)

    expect(container.querySelectorAll('path[transform]')).toHaveLength(RING_STAR_ANGLES.length)
    expect(container.textContent).not.toMatch(/[✦★]/)
  })

  it('prints the figure in the middle', () => {
    const { container } = render(badge)

    expect(container.querySelector('svg > text:last-of-type')).toHaveTextContent('16')
  })
})

describe('Medal', () => {
  const RIM = ['NCR Global Hackathon 2021', 'Team Eth Heads'] as const
  const medal = <Medal id="ncr-win" rank="1st" lines={['OF 300+', 'TEAMS']} rim={RIM} tone="hi" />

  it('sets each phrase on its own arc of the rim, where the geometry puts it', () => {
    const { container } = render(medal)
    const arcs = [...container.querySelectorAll('textPath')]
    const expected = medalRim(...RIM).arcs

    expect(arcs.map((arc) => arc.textContent)).toEqual([...RIM])
    expect(arcs.map((arc) => arc.getAttribute('href'))).toEqual(['#ncr-win-rim', '#ncr-win-rim'])
    expect(arcs.map((arc) => Number(arc.getAttribute('startOffset')))).toEqual(
      expected.map(({ start }) => start),
    )
    expect(arcs.map((arc) => Number(arc.getAttribute('textLength')))).toEqual(
      expected.map(({ length }) => length),
    )
  })

  it('draws a star between the phrases instead of typing one', () => {
    const { container } = render(medal)

    expect(container.querySelectorAll('path[transform]')).toHaveLength(2)
    expect(container.textContent).not.toMatch(/[✦★]/)
  })

  it('letters the rank in the middle, over its lines', () => {
    const { container } = render(medal)

    expect(texts(container)).toEqual([...RIM, '1st', 'OF 300+', 'TEAMS'])
  })

  it('sets every line of lettering at the one small size or larger', () => {
    const { container } = render(medal)
    const sizes = [...container.querySelectorAll('text')].map((text) =>
      Number(text.getAttribute('font-size')),
    )

    expect(sizes).toHaveLength(5)
    expect(Math.min(...sizes)).toBe(MEDAL.rimSize)
  })

  it('is cut from the tone it is given, and names its rim after the sticker', () => {
    const { container } = render(medal)

    expect(container.querySelector('svg')).toHaveClass(tones.hi ?? '')
    expect(ids(container)).toEqual(['ncr-win-rim'])
  })
})

describe('HexBadge', () => {
  it('letters the kicker, the title one word to a line, then the foot', () => {
    const { container } = render(
      <HexBadge kicker="1st overall" title={['Lightning', 'Welder']} foot="BTC++ Berlin ’24" />,
    )

    expect(texts(container)).toEqual(['1st overall', 'Lightning', 'Welder', 'BTC++ Berlin ’24'])
  })

  it('keeps the foot under the last line of the title, however long the title is', () => {
    const y = (title: readonly string[]): number => {
      const { container } = render(<HexBadge kicker="1st" title={title} foot="foot" />)
      return Number(container.querySelector('svg > text:last-of-type')?.getAttribute('y'))
    }

    expect(y(['Lightning', 'Welder'])).toBeGreaterThan(y(['Lightning']))
    expect(y([])).toBe(y(['Lightning']))
  })

  it('is filled with the shared foil', () => {
    const { container } = render(<HexBadge kicker="1st" title={['A']} foot="B" />)

    expect(container.querySelector('polygon')).toHaveAttribute('fill', `url(#${SHARED_IDS.foil})`)
  })
})

describe('Tally', () => {
  it('Tally draws N marks in fives', () => {
    const { container } = render(<Tally count={16} />)
    const marks = [...container.querySelectorAll('path')].map(
      (path) => path.getAttribute('d') ?? '',
    )

    expect(marks).toHaveLength(16)
    expect(marks.filter((mark) => mark.includes('L'))).toHaveLength(3)
  })

  it('sizes the drawing to the rows it needs', () => {
    const { container } = render(<Tally count={16} />)

    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 50 170')
  })
})

describe('illustrations', () => {
  it('prints the crab’s caption and names its filter after the sticker', () => {
    const { container } = render(<Crab id="clawthing-store" caption="clawthing.store" />)

    expect(container.querySelector('text')).toHaveTextContent('clawthing.store')
    expect(ids(container)).toEqual(['clawthing-store-die-cut'])
    expect(container.querySelector('g[filter]')).toHaveAttribute(
      'filter',
      'url(#clawthing-store-die-cut)',
    )
  })

  it('letters the arcade button around its top and bottom, on paths of its own', () => {
    const { container } = render(
      <ArcadeButton id="last-pay-wins" top="Last Pay Wins" bottom="2.5M+ SATS IN WEEK ONE" />,
    )
    const arcs = [...container.querySelectorAll('textPath')]

    expect(arcs.map((arc) => arc.textContent)).toEqual(['Last Pay Wins', '2.5M+ SATS IN WEEK ONE'])
    expect(arcs.map((arc) => arc.getAttribute('href'))).toEqual([
      '#last-pay-wins-upper',
      '#last-pay-wins-lower',
    ])
    expect(ids(container)).toEqual([
      'last-pay-wins-dome',
      'last-pay-wins-upper',
      'last-pay-wins-lower',
    ])
  })

  it('defines the shared foil and the photo’s gradient map once, under their own ids', () => {
    const { container } = render(<SharedDefs />)

    expect(ids(container).toSorted()).toEqual(Object.values(SHARED_IDS).toSorted())
    expect(container.querySelector('linearGradient')).toHaveAttribute(
      'gradientTransform',
      foilGradientTransform(FOIL_REST),
    )
  })

  it('takes a class on a glyph, so its sticker can size it', () => {
    const { container } = render(<Star className="mine" />)

    expect(container.querySelector('svg')).toHaveClass('mine')
  })
})
