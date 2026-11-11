import { length, mix, subtract, ZERO } from '../../lid/enhance/vector'
import type { Hang } from './hang'
import { resting, type Sim } from './sim'
import { REST } from './tuning'

/*
 * The way home under reduced motion. Let go, the badge does not fall, swing
 * or bounce: every part of it eases straight back to where it hangs, quickly
 * at first and then slowly, and never goes past.
 */

/** How long it takes to cover most of what is left, in seconds. */
const EASE_S = 0.14

export function ease(hang: Hang, sim: Sim, seconds: number): Sim {
  if (sim.asleep) {
    return sim
  }
  const home = resting(hang)
  const share = 1 - Math.exp(-Math.max(seconds, 0) / EASE_S)
  const at = mix(sim.body.at, home.body.at, share)
  const angle = sim.body.angle * (1 - share)
  if (length(subtract(at, home.body.at)) < REST.within && Math.abs(angle) < REST.angle) {
    return home
  }
  const strap = (index: 0 | 1): Sim['straps'][0] => ({
    nodes: sim.straps[index].nodes.map((node, at_) =>
      mix(node, home.straps[index].nodes[at_] ?? node, share),
    ),
    speeds: sim.straps[index].speeds.map(() => ZERO),
  })
  return {
    ...sim,
    body: { at, angle, velocity: ZERO, spin: 0 },
    straps: [strap(0), strap(1)],
    depth: { ...sim.depth, raise: sim.depth.raise * (1 - share) },
    snap: 0,
  }
}
