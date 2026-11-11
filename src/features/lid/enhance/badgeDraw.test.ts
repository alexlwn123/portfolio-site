import { beforeEach, describe, expect, it } from 'vitest'

import { lidFixture, type LidFixture } from '../../../test/lidFixture'
import { createHang, type Hang } from '../../badge/physics/hang'
import { resting, type Sim } from '../../badge/physics/sim'
import { slung } from '../../badge/physics/strap'
import { clearHang, drawHang } from './badgeDraw'
import { findHang, type HangParts, type Measured, measureHang } from './badgeMeasure'

let fixture: LidFixture
let parts: HangParts
let measured: Measured
let hang: Hang

beforeEach(() => {
  fixture = lidFixture()
  const found = findHang(fixture.lid)
  const measure = found && measureHang(found)
  const model = measure && createHang(measure.rig)
  if (!found || !measure || !model) {
    throw new Error('The fixture hangs')
  }
  ;[parts, measured, hang] = [found, measure, model]
})

/** The points a path is drawn through. */
function pointsOf(path: Element): readonly (readonly [number, number])[] {
  const numbers = (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
  return numbers.flatMap((value, index) =>
    index % 2 === 0 ? [[value, numbers[index + 1] ?? 0] as const] : [],
  )
}

/** The badge moved and turned, with its straps hanging slack from the clip. */
function moved(by: { x: number; y: number }, angle: number): Sim {
  const rest = resting(hang)
  return {
    ...rest,
    asleep: false,
    body: { ...rest.body, at: { x: hang.home.x + by.x, y: hang.home.y + by.y }, angle },
    straps: [slung(hang.lays[0].anchor, { x: 0, y: 0 }, 600), rest.straps[1]],
    depth: { turn: { x: 3, y: -2 }, rate: { x: 0, y: 0 }, raise: 0.5 },
  }
}

describe('drawing the badge', () => {
  it('moves and turns the badge about where it hangs, in em, with its turn in depth and its lift', () => {
    drawHang(parts, hang, measured, moved({ x: 20, y: -35 }, Math.PI / 18))
    const { style } = parts.badge

    expect(style.getPropertyValue('--hang-ox')).toBe('13em')
    expect(style.getPropertyValue('--hang-oy')).toBe('53.1em')
    expect(style.getPropertyValue('--hang-dx')).toBe('2em')
    expect(style.getPropertyValue('--hang-dy')).toBe('-3.5em')
    expect(style.getPropertyValue('--hang-turn')).toBe('10deg')
    expect(style.getPropertyValue('--tip-x')).toBe('3')
    expect(style.getPropertyValue('--tip-y')).toBe('-2')
    expect(style.getPropertyValue('--raise')).toBe('0.5')
    expect(parts.badge).toHaveAttribute('data-hang-moving')
  })

  it('bends each strap from where it is fixed to where it meets the clip, the right one drawn from the clip', () => {
    const sim = moved({ x: 0, y: -200 }, 0)
    drawHang(parts, hang, measured, sim)
    const [left, right] = parts.straps.map(({ line }) => pointsOf(line))

    expect(left?.[0]).toEqual([-96, -300])
    expect(left?.at(-1)).toEqual([124, 68])
    expect(right?.[0]).toEqual([136, 68])
    expect(right?.at(-1)).toEqual([356, -300])
    expect(left?.length).toBeGreaterThan(20)
  })

  it('narrows a strap pulled past its length, and leaves one at its length as wide as ever', () => {
    const rest = resting(hang)
    const pulled = {
      ...rest,
      asleep: false,
      body: { ...rest.body, at: { x: hang.home.x, y: hang.home.y + 40 } },
    }
    drawHang(parts, hang, measured, pulled)
    const thin = Number(parts.straps[0].group.style.getPropertyValue('--thin'))

    expect(thin).toBeGreaterThan(0.8)
    expect(thin).toBeLessThan(1)

    drawHang(parts, hang, measured, { ...rest, asleep: false })
    expect(parts.straps[0].group.style.getPropertyValue('--thin')).toBe('1')
  })

  it('sets a star at each of its places along the bent strap', () => {
    drawHang(parts, hang, measured, moved({ x: 0, y: -200 }, 0))

    expect(pointsOf(parts.straps[0].starPath)).toHaveLength(2)
    expect(pointsOf(parts.straps[1].starPath)).toHaveLength(2)
  })

  it('puts back exactly what the page drew when it is cleared', () => {
    drawHang(parts, hang, measured, moved({ x: 20, y: -35 }, 0.2))
    clearHang(parts)

    expect(parts.badge).not.toHaveAttribute('style')
    expect(parts.badge).not.toHaveAttribute('data-hang-moving')
    expect(parts.straps[0].group).not.toHaveAttribute('style')
    expect(parts.straps[0].line).toHaveAttribute('d', 'M-96 -300L124 268')
    expect(parts.straps[1].starPath).toHaveAttribute('d', 'M0 0L1 1')
  })
})
