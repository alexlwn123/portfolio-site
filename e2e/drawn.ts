import type { Locator } from '@playwright/test'

/*
 * What a section's body draws, as boxes on the screen. A layout is judged by
 * what a visitor sees, so this measures the lettering itself, anything with a
 * ground or a border of its own and the shapes of a drawing, and never the
 * boxes that only lay those out: a line of three words is as wide as its
 * words, not as wide as its paragraph.
 */

export interface Box {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

/** What the page says about one element of a section's body. */
interface Seen {
  /** Where its parent is in the list. The body is first in the list and has none. */
  readonly parent: number
  readonly box: Box
  /** The boxes of the lettering that is its own, not its children's. */
  readonly lettering: readonly Box[]
  /** Its box is drawn: it has a ground or a border, or is a picture or a shape of a drawing. */
  readonly solid: boolean
  /** How far its stroke reaches past its box. */
  readonly stroke: number
  /** It cuts off whatever in it reaches past its box. */
  readonly clips: boolean
  /** It is not drawn, and nor is anything in it. */
  readonly hidden: boolean
  /** It is one of the things asked about by name. */
  readonly asked: boolean
}

interface Look {
  /** One em of the section's frame, in px: ten design units. */
  readonly em: number
  /** The body's own box, which is the column. */
  readonly column: Box
  /** Every element of the body, in the order the markup has them. */
  readonly seen: readonly Seen[]
}

/** The elements of a drawing that put ink down themselves. */
const SHAPES = 'path, rect, circle, ellipse, line, polygon, polyline, text, use, image'
/** What a drawing keeps for later and never draws where it stands. */
const NEVER_DRAWN = 'defs'

interface Asked {
  /** The shapes of a drawing. */
  readonly shapes: string
  /** What is left out, with everything in it. */
  readonly leftOut: string
  /** The things to be measured one by one. */
  readonly each: string | null
}

/** Runs in the page: notes down every element of a section's body. Nothing is judged here. */
function look(section: Element, asked: Asked): Look {
  const body = section.querySelector('[data-section-body]')
  const units = section.querySelector('[data-units]')
  if (!body || !units) {
    throw new Error('Expected a section with a body set in the design unit')
  }
  const elements = [body, ...body.querySelectorAll('*')]
  const boxOf = ({ left, top, right, bottom }: DOMRect): Box => ({ left, top, right, bottom })
  const letteringOf = (element: Element): readonly Box[] =>
    [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== '')
      .flatMap((node) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        return [...range.getClientRects()].map(boxOf)
      })
  const seen = elements.map((element) => {
    const style = getComputedStyle(element)
    const shape = element instanceof SVGGraphicsElement && element.matches(asked.shapes)
    const matrix = shape ? element.getScreenCTM() : null
    const laidOut = element.getClientRects().length > 0
    return {
      parent: element.parentElement ? elements.indexOf(element.parentElement) : -1,
      box: boxOf(element.getBoundingClientRect()),
      lettering: element instanceof SVGElement && !shape ? [] : letteringOf(element),
      solid:
        laidOut &&
        (shape ||
          element instanceof HTMLImageElement ||
          style.backgroundImage !== 'none' ||
          style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
          style.borderWidth.split(' ').some((width) => Number.parseFloat(width) > 0)),
      stroke:
        matrix && style.stroke !== 'none'
          ? (Number.parseFloat(style.strokeWidth) * Math.hypot(matrix.a, matrix.b)) / 2
          : 0,
      clips: style.overflowX !== 'visible' || style.overflowY !== 'visible',
      hidden:
        style.visibility === 'hidden' ||
        style.clipPath === 'inset(50%)' ||
        element.matches(asked.leftOut),
      asked: asked.each !== null && element.matches(asked.each),
    }
  })
  return {
    em: Number.parseFloat(getComputedStyle(units).fontSize),
    column: boxOf(body.getBoundingClientRect()),
    seen,
  }
}

/** The part two boxes share. It has no size when they are apart. */
export function meet(one: Box, other: Box): Box {
  return {
    left: Math.max(one.left, other.left),
    top: Math.max(one.top, other.top),
    right: Math.min(one.right, other.right),
    bottom: Math.min(one.bottom, other.bottom),
  }
}

/** Whether a box is big enough to see: more than a pixel each way. */
export function isReal({ left, top, right, bottom }: Box): boolean {
  return right - left > 1 && bottom - top > 1
}

/** An element and everything it is inside, itself first, by their places in the list. */
function ancestry(seen: readonly Seen[], index: number): readonly number[] {
  const parent = seen[index]?.parent ?? -1
  return parent < 0 ? [index] : [index, ...ancestry(seen, parent)]
}

/** What one element draws itself, cut down to what the elements it is inside let through. */
function drawnBy(seen: readonly Seen[], chain: readonly number[]): readonly Box[] {
  const [own, ...above] = chain.flatMap((index) => seen[index] ?? [])
  if (!own || own.hidden || above.some(({ hidden }) => hidden)) {
    return []
  }
  const { box, stroke } = own
  const shape = {
    left: box.left - stroke,
    top: box.top - stroke,
    right: box.right + stroke,
    bottom: box.bottom + stroke,
  }
  return [...own.lettering, ...(own.solid ? [shape] : [])]
    .map((drawn) =>
      above.filter(({ clips }) => clips).reduce((cut, { box: by }) => meet(cut, by), drawn),
    )
    .filter(isReal)
}

export interface Drawing {
  /** One em of the section's frame, in px: ten design units. */
  readonly em: number
  /** The column the body is set in. */
  readonly column: Box
  /** Everything the body draws. */
  readonly all: readonly Box[]
  /** What each of the things asked about draws, in the order the markup has them. */
  readonly each: readonly (readonly Box[])[]
  /** The box each of them is laid out in, whatever it draws. */
  readonly laidOut: readonly Box[]
}

/**
 * Everything a section's body draws, as boxes on the screen. Furniture that
 * is meant to run off the column (a ruler along the mat, an arm that runs off
 * the page) is left out by its selector, and the things matching `each` are
 * also given one by one.
 */
export async function drawing(
  section: Locator,
  ignore: readonly string[] = [],
  each: string | null = null,
): Promise<Drawing> {
  const { em, column, seen } = await section.evaluate(look, {
    shapes: SHAPES,
    leftOut: [NEVER_DRAWN, ...ignore].join(', '),
    each,
  })
  const chains = seen.map((_, index) => ancestry(seen, index))
  const drawn = chains.map((chain) => drawnBy(seen, chain))
  const under = (root: number): readonly Box[] =>
    chains.flatMap((chain, index) => (chain.includes(root) ? (drawn[index] ?? []) : []))
  return {
    em,
    column,
    all: drawn.flat(),
    each: seen.flatMap(({ asked }, index) => (asked ? [under(index)] : [])),
    laidOut: seen.flatMap(({ asked, box }) => (asked ? [box] : [])),
  }
}
