import { describe, expect, it } from 'vitest'

import { distance, FRAME_S, RIG } from '../../../test/hangRig'
import { reach } from './body'
import { ease } from './calm'
import { dropped, tossed } from './entrance'
import { createHang, type Hang } from './hang'
import { advance, AT_EASE, endsOf, resting, type Sim, wake } from './sim'
import { lengthOf, lineOf } from './strap'

function hangOf(): Hang {
  const made = createHang(RIG)
  if (made === null) {
    throw new Error('The rig hangs')
  }
  return made
}

const hang = hangOf()

function settle(from: Sim, frames: number): readonly Sim[] {
  return Array.from({ length: frames }).reduce<readonly Sim[]>(
    (states) => [...states, advance(hang, states.at(-1) ?? from, AT_EASE, FRAME_S)],
    [from],
  )
}

describe('dropping in', () => {
  it('starts the badge a given height above where it hangs, awake, with its straps slack', () => {
    const start = dropped(hang, 700)
    const ends = endsOf(hang, start.body)

    expect(start.asleep).toBe(false)
    expect(start.body.at.y).toBeCloseTo(hang.home.y - 700, 6)
    hang.lays.forEach((lay, index) => {
      const line = lineOf(
        start.straps[index] ?? start.straps[0],
        lay.anchor,
        ends[index] ?? ends[0],
      )
      expect(lengthOf(line)).toBeCloseTo(lay.length, 6)
      expect(distance(lay.anchor, ends[index] ?? ends[0])).toBeLessThan(lay.length)
    })
  })

  it('falls onto its lanyard, snaps the straps taut and comes to rest where the page draws it', () => {
    const states = settle(dropped(hang, 700), 300)

    expect(Math.max(...states.map(({ snap }) => snap))).toBeGreaterThan(0.5)
    expect(states.at(-1)).toEqual(resting(hang))
    expect(states.findIndex(({ asleep }) => asleep)).toBeLessThan(240)
  })

  it('never comes down further than the straps allow', () => {
    for (const { body } of settle(dropped(hang, 700), 120)) {
      hang.ropes.forEach((rope) => {
        expect(distance(reach(body, hang.arm), rope.anchor)).toBeLessThanOrEqual(
          rope.rest + rope.give,
        )
      })
    }
  })
})

describe('a toss, for a badge the page has already shown', () => {
  it('starts where the stylesheet’s sway has the badge, and going up', () => {
    const sway = 0.02
    const start = tossed(hang, sway)
    const top = { x: 130, y: -300 }

    expect(start.asleep).toBe(false)
    expect(start.body.angle).toBe(sway)
    expect(distance(start.body.at, top)).toBeCloseTo(distance(hang.home, top), 6)
    expect(start.body.at.x).toBeLessThan(hang.home.x)
    expect(start.body.velocity.y).toBeLessThan(0)
  })

  it('goes up a little, lands on its lanyard and settles', () => {
    const states = settle(tossed(hang, -0.02), 300)
    const highest = Math.min(...states.map(({ body }) => body.at.y))

    expect(hang.home.y - highest).toBeGreaterThan(30)
    expect(hang.home.y - highest).toBeLessThan(250)
    expect(states.at(-1)).toEqual(resting(hang))
  })
})

describe('coming back calmly', () => {
  const away = Array.from({ length: 60 }).reduce<Sim>(
    (sim) =>
      advance(
        hang,
        sim,
        { ...AT_EASE, grab: { at: { x: 0, y: 0 }, to: { x: -90, y: 300 }, speed: { x: 0, y: 0 } } },
        FRAME_S,
      ),
    wake(resting(hang)),
  )

  it('moves everything a part of the way home each frame, and never past it', () => {
    const states = Array.from({ length: 40 }).reduce<readonly Sim[]>(
      (all) => [...all, ease(hang, all.at(-1) ?? away, FRAME_S)],
      [away],
    )
    const far = states.map(({ body }) => distance(body.at, hang.home))

    expect(far).toEqual(far.toSorted((one, other) => other - one))
    expect(far[10]).toBeLessThan((far[0] ?? 0) / 2)
    for (const { body } of states) {
      expect(body.at.x).toBeLessThanOrEqual(hang.home.x)
      expect(body.velocity).toEqual({ x: 0, y: 0 })
    }
  })

  it('arrives: once it is as good as home it is put exactly there, asleep', () => {
    const home = Array.from({ length: 180 }).reduce<Sim>((sim) => ease(hang, sim, FRAME_S), away)

    expect(home).toEqual(resting(hang))
    expect(ease(hang, home, FRAME_S)).toBe(home)
  })

  it('leaves the badge alone when no time has passed', () => {
    expect(ease(hang, away, 0).body.at).toEqual(away.body.at)
  })
})
