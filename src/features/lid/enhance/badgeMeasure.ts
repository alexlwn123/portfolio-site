import type { Rig } from '../../badge/physics/hang'
import { add, type Point, RAD_PER_DEG, turn } from './vector'

/*
 * The lanyard and the badge as the page has laid them out, read into the
 * physics' terms. Everything is in the lanyard drawing's own unit, which is
 * the lid's design unit (a tenth of an em): where the straps are fixed and
 * where they meet the clip come from the lines the page drew, and the card's
 * middle and size from its layout box. Layout boxes are read, not screen
 * boxes, so nothing the script has moved or turned is measured.
 */

/** One strap as the page drew it. */
export interface StrapParts {
  /** The element that holds the strap: --thin is set on it. */
  readonly group: SVGElement
  /** The line the strap is drawn and lettered along. */
  readonly line: SVGElement
  /** The line the stars ride. */
  readonly starPath: SVGElement
  /** Where each star sits, as a share of the strap's length from the start of its line. */
  readonly stars: readonly number[]
  /** The line as the page drew it, and the stars' line. */
  readonly restLine: string
  readonly restStars: string
  /** True when the line starts at the end fixed above the lid: false when it starts at the clip. */
  readonly fixedAtStart: boolean
}

export interface HangParts {
  readonly lanyard: HTMLElement
  readonly badge: HTMLElement
  /** The sleeve and the ribbons: what a hand takes hold of. */
  readonly card: HTMLElement
  readonly drawing: SVGSVGElement
  readonly straps: readonly [StrapParts, StrapParts]
}

export interface Measured {
  readonly rig: Rig
  /** Screen px to one unit. */
  readonly unitPx: number
  /** The badge sticker's top left corner, in the lanyard drawing's units. */
  readonly badgeAt: Point
}

const HALF = 0.5
/** Two measures this close, in units, hang the same. */
const SAME_WITHIN = 0.01

function strapOf(group: SVGElement): StrapParts | null {
  const line = group.querySelector<SVGElement>('[data-strap-line]')
  const starPath = group.querySelector<SVGElement>('[data-strap-stars]')
  if (!line || !starPath) {
    return null
  }
  const stars = (starPath.getAttribute('data-strap-stars') ?? '')
    .split(' ')
    .filter((share) => share !== '')
    .map(Number)
    .filter(Number.isFinite)
  return {
    group,
    line,
    starPath,
    stars,
    restLine: line.getAttribute('d') ?? '',
    restStars: starPath.getAttribute('d') ?? '',
    fixedAtStart: group.getAttribute('data-strap') === 'from',
  }
}

/** Finds the lanyard, the badge and the straps, or null when any of them is missing. */
export function findHang(lid: HTMLElement): HangParts | null {
  const lanyard = lid.querySelector<HTMLElement>('[data-sticker="lanyard"]')
  const badge = lid.querySelector<HTMLElement>('[data-sticker="badge"]')
  const card = badge?.querySelector<HTMLElement>('[data-badge-card]')
  const drawing = lanyard?.querySelector<SVGSVGElement>('svg[data-lanyard]')
  const groups = drawing ? [...drawing.querySelectorAll<SVGElement>('[data-strap]')] : []
  const straps = groups.map(strapOf)
  const [left, right] = straps
  if (!lanyard || !badge || !card || !drawing || straps.length !== 2 || !left || !right) {
    return null
  }
  return { lanyard, badge, card, drawing, straps: [left, right] }
}

/** The two ends of a straight line drawn as "M x y L x y", or null. */
function endsOfLine(d: string): readonly [Point, Point] | null {
  const numbers = /^M(-?[\d.]+) (-?[\d.]+)L(-?[\d.]+) (-?[\d.]+)$/
    .exec(d.trim())
    ?.slice(1)
    .map(Number)
  if (!numbers?.every(Number.isFinite)) {
    return null
  }
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = numbers
  return [
    { x: x1, y: y1 },
    { x: x2, y: y2 },
  ]
}

/** Where a strap is fixed and where it meets the clip. */
function strapEnds(strap: StrapParts): readonly [Point, Point] | null {
  const ends = endsOfLine(strap.restLine)
  return ends && (strap.fixedAtStart ? ends : [ends[1], ends[0]])
}

/** The turn the stylesheet gives an element, in radians. A browser that says nothing gives none. */
export function turnOf(element: HTMLElement): number {
  const view = element.ownerDocument.defaultView
  const degrees = Number.parseFloat(view?.getComputedStyle(element).rotate ?? '')
  return Number.isFinite(degrees) ? degrees * RAD_PER_DEG : 0
}

/** The card's middle, from its top edge's middle, which is where the stylesheet turns it about. */
function cardOf({ card }: HangParts, badgeAt: Point, unitPx: number): Pick<Rig, 'centre' | 'size'> {
  const size = { width: card.offsetWidth / unitPx, height: card.offsetHeight / unitPx }
  const top = add(badgeAt, {
    x: (card.offsetLeft + card.offsetWidth * HALF) / unitPx,
    y: card.offsetTop / unitPx,
  })
  return { centre: add(top, turn({ x: 0, y: size.height * HALF }, turnOf(card))), size }
}

/** How many units wide the drawing is, by its viewBox: NaN when it has none. */
function widthOf(drawing: SVGSVGElement): number {
  const [, , width] = (drawing.getAttribute('viewBox') ?? '').split(' ').map(Number)
  return width ?? Number.NaN
}

/** Reads the hang off the page, or null when it is not laid out or cannot be read. */
export function measureHang(parts: HangParts): Measured | null {
  const { lanyard, badge, drawing, straps } = parts
  const unitPx = lanyard.offsetWidth / widthOf(drawing)
  const [left, right] = [strapEnds(straps[0]), strapEnds(straps[1])]
  if (!Number.isFinite(unitPx) || unitPx <= 0 || !left || !right) {
    return null
  }
  const badgeAt = {
    x: (badge.offsetLeft - lanyard.offsetLeft) / unitPx,
    y: (badge.offsetTop - lanyard.offsetTop) / unitPx,
  }
  return {
    rig: {
      anchors: [left[0], right[0]],
      ends: [left[1], right[1]],
      ...cardOf(parts, badgeAt, unitPx),
    },
    unitPx,
    badgeAt,
  }
}

function numbersOf({ anchors, ends, centre, size }: Rig): readonly number[] {
  return [...anchors, ...ends, centre, { x: size.width, y: size.height }].flatMap(({ x, y }) => [
    x,
    y,
  ])
}

/** True when two measures hang the badge in the same place: a change of scale alone is no change. */
export function sameRig(one: Rig, other: Rig): boolean {
  const theirs = numbersOf(other)
  return numbersOf(one).every(
    (value, index) => Math.abs(value - (theirs[index] ?? NaN)) < SAME_WITHIN,
  )
}
