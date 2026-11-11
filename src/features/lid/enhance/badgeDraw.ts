import { pointAt, reaches, smooth } from '../../badge/physics/curve'
import type { Hang } from '../../badge/physics/hang'
import { endsOf, type Sim } from '../../badge/physics/sim'
import { lineOf } from '../../badge/physics/strap'
import { UNITS_PER_EM } from '../placement/artboards'
import type { HangParts, Measured, StrapParts } from './badgeMeasure'
import { clearVars, setVars } from './style'
import { DEG_PER_RAD, type Point, subtract } from './vector'

/*
 * Draws what the physics says. The badge sticker is moved and turned by five
 * custom properties (see hang.module.css): --hang-ox and --hang-oy, where it
 * hangs from, --hang-dx and --hang-dy, how far it has moved from there, and
 * --hang-turn. Three more, --tip-x and --tip-y (in degrees) and --raise, turn the card in
 * depth and lift its shadow (see Badge.module.css). Each strap is redrawn as
 * a rounded line, and its stars are set along it; a strap pulled past its
 * length is given a --thin below 1.
 */

const BADGE_VARS = [
  '--hang-ox',
  '--hang-oy',
  '--hang-dx',
  '--hang-dy',
  '--hang-turn',
  '--tip-x',
  '--tip-y',
  '--raise',
] as const

/** Each piece of a strap is drawn as this many, along a curve through its points. */
const CURVE_STEPS = 3
/** How much narrower a strap gets for each share of its length it is stretched by. */
const THINNING = 1.4
const UNIT_DECIMALS = 2
const SHARE_DECIMALS = 3

function fixed(value: number, decimals: number): string {
  const tidy = Number(value.toFixed(decimals))
  return String(tidy === 0 ? 0 : tidy)
}

function em(units: number): string {
  return `${fixed(units / UNITS_PER_EM, SHARE_DECIMALS)}em`
}

function pathOf(points: readonly Point[]): string {
  return `M${points.map(({ x, y }) => `${fixed(x, UNIT_DECIMALS)} ${fixed(y, UNIT_DECIMALS)}`).join('L')}`
}

function lengthOfLine(line: readonly Point[]): number {
  return reaches(line).at(-1) ?? 0
}

/** One strap, from where it is fixed to the clip, drawn the way its line runs. */
function drawStrap(parts: StrapParts, points: readonly Point[], rest: number): void {
  const line = smooth(parts.fixedAtStart ? points : [...points].reverse(), CURVE_STEPS)
  const far = reaches(line)
  const stretch = Math.max(lengthOfLine(line) / rest - 1, 0)
  parts.line.setAttribute('d', pathOf(line))
  parts.starPath.setAttribute('d', pathOf(parts.stars.map((share) => pointAt(line, far, share))))
  setVars(parts.group, { '--thin': fixed(1 - stretch * THINNING, SHARE_DECIMALS) })
}

/** Draws the badge and its straps where the simulation has them. */
export function drawHang(parts: HangParts, hang: Hang, { badgeAt }: Measured, sim: Sim): void {
  const { body, depth, straps } = sim
  const origin = subtract(hang.home, badgeAt)
  const moved = subtract(body.at, hang.home)
  setVars(parts.badge, {
    '--hang-ox': em(origin.x),
    '--hang-oy': em(origin.y),
    '--hang-dx': em(moved.x),
    '--hang-dy': em(moved.y),
    '--hang-turn': `${fixed(body.angle * DEG_PER_RAD, UNIT_DECIMALS)}deg`,
    '--tip-x': fixed(depth.turn.x, UNIT_DECIMALS),
    '--tip-y': fixed(depth.turn.y, UNIT_DECIMALS),
    '--raise': fixed(depth.raise, SHARE_DECIMALS),
  })
  parts.badge.setAttribute('data-hang-moving', '')
  const ends = endsOf(hang, body)
  parts.straps.forEach((strap, index) => {
    const lay = hang.lays[index === 0 ? 0 : 1]
    drawStrap(
      strap,
      lineOf(straps[index === 0 ? 0 : 1], lay.anchor, ends[index] ?? lay.anchor),
      lay.length,
    )
  })
}

/** Puts back exactly what the page drew. */
export function clearHang(parts: HangParts): void {
  clearVars(parts.badge, BADGE_VARS)
  parts.badge.removeAttribute('data-hang-moving')
  for (const strap of parts.straps) {
    strap.line.setAttribute('d', strap.restLine)
    strap.starPath.setAttribute('d', strap.restStars)
    clearVars(strap.group, ['--thin'])
  }
}
