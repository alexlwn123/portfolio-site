import { describe, expect, it } from 'vitest'

import { distance, FRAME_S, LOPSIDED, numbersOf, RIG } from '../../../test/hangRig'
import { add, type Point, ZERO } from '../../lid/enhance/vector'
import { reach } from './body'
import { createHang, type Hang } from './hang'
import { lengthOf, lineOf } from './strap'
import { advance, AT_EASE, endsOf, type Push, resting, type Sim, wake } from './sim'
import { GRAVITY, MAX_STEPS, ROPE, STEP } from './tuning'

function hangOf(rig = RIG): Hang {
  const hang = createHang(rig)
  if (hang === null) {
    throw new Error('The rig hangs')
  }
  return hang
}

const hang = hangOf()

/** Runs whole frames, and gives back every state on the way. */
function run(from: Sim, push: Push, frames: number, model = hang): readonly Sim[] {
  return Array.from({ length: frames }).reduce<readonly Sim[]>(
    (states) => [...states, advance(model, states.at(-1) ?? from, push, FRAME_S)],
    [from],
  )
}

function last(states: readonly Sim[]): Sim {
  const state = states.at(-1)
  if (!state) {
    throw new Error('Nothing was run')
  }
  return state
}

/** The badge held by a point of itself (measured from its middle), at a place. */
function held(at: Point, to: Point): Push {
  return { ...AT_EASE, grab: { at, to, speed: ZERO } }
}

/** Held by its middle and carried a distance from where it hangs. */
function carriedBy(offset: Point, frames = 90): Sim {
  return last(run(wake(resting(hang)), held(ZERO, add(hang.home, offset)), frames))
}

function pivotOf(sim: Sim, model = hang): Point {
  return reach(sim.body, model.arm)
}

/** The energy of the badge's motion and height. What is stored in a stretched strap is left out. */
function energyOf({ body }: Sim): number {
  const moving = (body.velocity.x ** 2 + body.velocity.y ** 2) / 2
  const turning = body.spin ** 2 / hang.turning / 2
  return moving + turning - GRAVITY * body.at.y
}

describe('the badge hanging still', () => {
  it('starts asleep, exactly where the page draws it', () => {
    const rest = resting(hang)

    expect(rest.asleep).toBe(true)
    expect(rest.body.at).toEqual({ x: 130, y: 531 })
    expect(rest.body.angle).toBe(0)
    expect(pivotOf(rest)).toEqual({ x: 130, y: 268 })
    expect(endsOf(hang, rest.body)).toEqual(RIG.ends)
    expect(lineOf(rest.straps[0], RIG.anchors[0], RIG.ends[0])).toHaveLength(11)
  })

  it('stays exactly there when it is woken and left alone for ten seconds', () => {
    const rest = resting(hang)
    const states = run({ ...wake(rest), quiet: -Infinity }, AT_EASE, 600)

    for (const state of states) {
      expect(distance(state.body.at, rest.body.at)).toBeLessThan(1e-9)
      expect(Math.abs(state.body.angle)).toBeLessThan(1e-12)
      state.straps.forEach((strap, index) => {
        strap.nodes.forEach((node, at) => {
          // The straps hold to within the rounding of a square root: a ten-millionth of a unit.
          expect(distance(node, rest.straps[index]?.nodes[at] ?? ZERO)).toBeLessThan(1e-6)
        })
      })
    }
  })

  it('rests just as exactly when the lanyard is hung lopsided', () => {
    const lopsided = hangOf(LOPSIDED)
    const rest = resting(lopsided)
    const states = run({ ...wake(rest), quiet: -Infinity }, AT_EASE, 300, lopsided)

    expect(distance(last(states).body.at, rest.body.at)).toBeLessThan(1e-9)
    expect(Math.abs(last(states).body.angle)).toBeLessThan(1e-12)
  })

  it('goes back to sleep at once when nothing has moved it', () => {
    const states = run(wake(resting(hang)), AT_EASE, 60)

    expect(last(states)).toEqual(resting(hang))
    expect(states.findIndex(({ asleep }) => asleep)).toBeLessThanOrEqual(30)
  })

  it('does no work while it is asleep', () => {
    const rest = resting(hang)

    expect(advance(hang, rest, AT_EASE, FRAME_S)).toBe(rest)
  })

  it('cannot be hung from straps that would not both hold it', () => {
    const besideIt = { ...RIG, anchors: [RIG.anchors[0], { x: -40, y: -300 }] } as const
    const belowIt = { ...RIG, centre: { x: 120, y: 200 } }

    expect(createHang(besideIt)).toBeNull()
    expect(createHang(belowIt)).toBeNull()
    expect(createHang({ ...RIG, size: { width: 0, height: 0 } })).toBeNull()
  })
})

describe('the badge let go', () => {
  it.each([
    ['pulled down and aside', { x: -260, y: 60 }],
    ['lifted', { x: 40, y: -320 }],
    ['swung out to the right', { x: 300, y: -120 }],
  ])('comes back to rest within six seconds when %s', (_, offset) => {
    const states = run(carriedBy(offset), AT_EASE, 360)

    expect(last(states)).toEqual(resting(hang))
  })

  it('swings before it settles: it is a pendulum, not a spring-loaded door', () => {
    const states = run(carriedBy({ x: -260, y: 60 }), AT_EASE, 240)
    const sides = states.map(({ body }) => Math.sign(Math.round(body.at.x - hang.home.x)))
    const crossings = sides.filter((side, index) => side !== 0 && side === -(sides[index - 1] ?? 0))

    expect(crossings.length).toBeGreaterThanOrEqual(2)
  })

  it('never gains energy on the way', () => {
    const lifted = carriedBy({ x: 120, y: -360 })
    const dropped = { ...lifted, body: { ...lifted.body, velocity: ZERO, spin: 0 } }
    const states = run(dropped, AT_EASE, 360)
    const start = energyOf(dropped)

    for (const state of states) {
      expect(energyOf(state)).toBeLessThanOrEqual(start + 1)
    }
    expect(energyOf(last(states))).toBeLessThan(start)
  })

  it('keeps the speed of the hand: let go while moving, it is thrown', () => {
    const swept = Array.from({ length: 12 }).reduce<Sim>(
      (sim, _, frame) =>
        advance(hang, sim, held(ZERO, add(hang.home, { x: -frame * 30, y: -200 })), FRAME_S),
      carriedBy({ x: 0, y: -200 }),
    )
    const [, next] = run(swept, AT_EASE, 1)

    expect(swept.body.velocity.x).toBeLessThan(-900)
    expect(next?.body.at.x).toBeLessThan(swept.body.at.x - 10)
  })

  it('is webbing, not elastic: let go at the limit of a long pull, the stretch does not fling it', () => {
    const pulls = [
      { x: 0, y: 900 },
      { x: 600, y: 600 },
      { x: -700, y: 300 },
    ]
    for (const offset of pulls) {
      const [letGo, ...after] = run(carriedBy(offset, 120), AT_EASE, 120)
      const start = energyOf(letGo ?? resting(hang))
      // The straps must lift it back up to where it hangs, and a strap coming back to its length
      // may lift it by as much as it was stretched. A catapult throws it far higher than that.
      const backUp = Math.max((letGo?.body.at.y ?? 0) - hang.home.y, 0) + hang.ropes[0].give
      const gain = Math.max(...after.map(energyOf)) - start

      expect(gain).toBeLessThan(GRAVITY * backUp)
    }
  })

  it('reports the straps snapping taut when it drops onto them, and not while it hangs', () => {
    const states = run(carriedBy({ x: 0, y: -300 }), AT_EASE, 60)

    expect(Math.max(...states.map(({ snap }) => snap))).toBeGreaterThan(0.2)
    expect(last(run(wake(resting(hang)), AT_EASE, 5)).snap).toBe(0)
  })
})

describe('the badge in the hand', () => {
  it('follows the hand by the point it was taken by', () => {
    const corner = { x: 100, y: 200 }
    const to = add(hang.home, { x: -150, y: -250 })
    const sim = last(run(wake(resting(hang)), held(corner, to), 120))

    expect(distance(reach(sim.body, corner), to)).toBeLessThan(3)
    expect(sim.asleep).toBe(false)
  })

  it('dangles from that point: taken by a corner and lifted, its middle hangs below the corner', () => {
    const corner = { x: 110, y: -220 }
    const sim = last(run(wake(resting(hang)), held(corner, add(hang.home, { x: 0, y: -420 })), 240))
    const hungFrom = reach(sim.body, corner)

    expect(Math.abs(sim.body.at.x - hungFrom.x)).toBeLessThan(4)
    expect(sim.body.at.y).toBeGreaterThan(hungFrom.y)
    expect(Math.abs(sim.body.angle)).toBeGreaterThan(0.3)
  })

  it('never lets a strap past its limit, however hard and however fast it is pulled', () => {
    const wild = (frame: number): Point => ({
      x: hang.home.x + Math.sin(frame * 0.7) * 2400,
      y: hang.home.y + Math.cos(frame * 0.31) * 2400,
    })
    const states = Array.from({ length: 240 }).reduce<readonly Sim[]>(
      (all, _, frame) => [
        ...all,
        advance(hang, all.at(-1) ?? resting(hang), held({ x: 60, y: 150 }, wild(frame)), FRAME_S),
      ],
      [wake(resting(hang))],
    )

    for (const state of states) {
      const ends = endsOf(hang, state.body)
      hang.ropes.forEach((rope, index) => {
        const limit = rope.rest + rope.give
        const lay = hang.lays[index] ?? hang.lays[0]
        const line = lineOf(state.straps[index] ?? state.straps[0], lay.anchor, ends[index] ?? ZERO)

        expect(distance(pivotOf(state), rope.anchor)).toBeLessThanOrEqual(limit)
        // A strap is drawn to its own end of the clip, which is a little to one side of the middle.
        expect(lengthOf(line)).toBeLessThanOrEqual(limit + distance(lay.offset, ZERO) + 1e-6)
      })
    }
  })

  it('stops against the straps: pulled far down, it stretches them visibly and goes no further', () => {
    const far = last(run(wake(resting(hang)), held(ZERO, add(hang.home, { x: 0, y: 900 })), 120))
    const further = last(run(far, held(ZERO, add(hang.home, { x: 0, y: 2400 })), 120))
    const stretch = distance(pivotOf(far), RIG.anchors[0]) / distance(RIG.ends[0], RIG.anchors[0])

    expect(stretch).toBeGreaterThan(1.06)
    expect(stretch).toBeLessThan(1 + ROPE.stretch + 0.01)
    expect(further.body.at.y - far.body.at.y).toBeLessThan(8)
    expect(far.body.at.y).toBeLessThan(hang.home.y + 120)
  })

  it('gives a little before it stops: a short pull stretches the straps a part of the way', () => {
    const short = carriedBy({ x: 0, y: 40 })
    const moved = short.body.at.y - hang.home.y

    expect(moved).toBeGreaterThan(12)
    expect(moved).toBeLessThan(32)
  })

  it('lets a slack strap sag: lifted, both straps bow below the straight line between their ends', () => {
    const sim = carriedBy({ x: 0, y: -300 }, 240)
    const ends = endsOf(hang, sim.body)

    hang.lays.forEach((lay, index) => {
      const end = ends[index] ?? ZERO
      const line = lineOf(sim.straps[index] ?? sim.straps[0], lay.anchor, end)
      const middle = line[5] ?? ZERO
      const chordY = (lay.anchor.y + end.y) / 2

      expect(middle.y).toBeGreaterThan(chordY + 40)
      expect(lengthOf(line)).toBeLessThanOrEqual(lay.length + 1e-6)
      expect(lengthOf(line)).toBeGreaterThan(lay.length * 0.97)
    })
  })

  it('keeps a taut strap straight', () => {
    const sim = carriedBy({ x: -200, y: 80 })
    const ends = endsOf(hang, sim.body)
    const line = lineOf(sim.straps[1], hang.lays[1].anchor, ends[1])

    expect(lengthOf(line)).toBeCloseTo(distance(hang.lays[1].anchor, ends[1]), 6)
  })

  it('does not swing when calm is asked for: it follows the hand without overshoot', () => {
    const to = add(hang.home, { x: -220, y: -260 })
    const states = run(wake(resting(hang)), { ...held(ZERO, to), calm: true }, 120)
    const overshoot = Math.min(...states.map(({ body }) => body.at.x)) - to.x

    expect(distance(last(states).body.at, to)).toBeLessThan(3)
    expect(overshoot).toBeGreaterThan(-1)
  })
})

describe('time and the simulation', () => {
  it('moves the same way however the time is cut into frames', () => {
    const start = carriedBy({ x: -200, y: -150 })
    const fine = Array.from({ length: 120 }).reduce<Sim>(
      (sim) => advance(hang, sim, AT_EASE, FRAME_S / 2),
      start,
    )
    const coarse = last(run(start, AT_EASE, 60))

    expect(distance(fine.body.at, coarse.body.at)).toBeLessThan(0.5)
  })

  it('takes no more than its limit of steps for one frame, however long the frame', () => {
    const start = { ...carriedBy({ x: -200, y: -150 }), owed: 0 }
    const stalled = advance(hang, start, AT_EASE, 5)
    const capped = advance(hang, start, AT_EASE, MAX_STEPS * STEP)

    expect(stalled.body).toEqual(capped.body)
  })

  it('does not explode on wild time steps', () => {
    const steps = [5, 0, 0.5, 1e-7, 0.25, 30, -1, 0.1, Number.MAX_SAFE_INTEGER, 0.016]
    const wildly = steps.reduce<Sim>(
      (sim, seconds, index) =>
        advance(hang, sim, held({ x: 50, y: 50 }, { x: index * 400 - 1500, y: 2000 }), seconds),
      wake(resting(hang)),
    )
    const settled = last(run(wildly, AT_EASE, 480))

    for (const value of numbersOf(wildly)) {
      expect(Number.isFinite(value)).toBe(true)
      expect(Math.abs(value)).toBeLessThan(1e5)
    }
    expect(settled).toEqual(resting(hang))
  })

  it('never changes the state it is given', () => {
    const start = Object.freeze(carriedBy({ x: -100, y: -100 }))
    const copy = structuredClone(start)

    advance(hang, start, AT_EASE, FRAME_S)

    expect(start).toEqual(copy)
  })
})

describe('gravity that leans', () => {
  it('hangs the badge towards the low side of a tilted phone, and lets it sleep there', () => {
    const leaning = { ...AT_EASE, lean: 0.3 }
    const states = run(wake(resting(hang)), leaning, 480)
    const sim = last(states)

    expect(sim.asleep).toBe(true)
    expect(sim.body.at.x).toBeGreaterThan(hang.home.x + 40)
    expect(Math.abs(sim.body.angle)).toBeGreaterThan(0.1)
  })

  it('comes home when the phone is level again', () => {
    const leaned = last(run(wake(resting(hang)), { ...AT_EASE, lean: -0.3 }, 480))

    expect(last(run(wake(leaned), AT_EASE, 480))).toEqual(resting(hang))
  })
})

describe('what holds the badge', () => {
  it('gives every strap a length a little under the one it hangs at: the badge’s weight makes up the rest', () => {
    hang.ropes.forEach((rope, index) => {
      const hung = distance(RIG.anchors[index] ?? ZERO, { x: 130, y: 268 })

      expect(rope.rest).toBeLessThan(hung)
      expect(rope.rest).toBeGreaterThan(hung - 6)
      expect(rope.give).toBeCloseTo(hung * ROPE.stretch, 6)
    })
  })
})
