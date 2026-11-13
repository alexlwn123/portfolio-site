/*
 * How the badge and its lanyard behave. Lengths are in the lanyard's own unit
 * (a tenth of an em on the lid), times in seconds and angles in radians. The
 * badge weighs one of whatever mass is measured in: only ratios matter.
 */

const STEPS_PER_SECOND = 480
/** The simulation moves in steps of this length, however long a frame is. */
export const STEP = 1 / STEPS_PER_SECOND
/** One frame is given no more steps than this: a stall slows the badge, it does not hurl it. */
export const MAX_STEPS = 24

/** Units a second, each second. Strong, as on a real lanyard seen this size. */
export const GRAVITY = 14_000

const STEPS_SQUARED = 1 / (STEP * STEP)
/** How stiff a strap is at first, and the hand: the higher, the firmer. */
const ROPE_STIFFNESS = 3000
const HAND_STIFFNESS = 9200

export const ROPE = {
  /** How far past its length a strap can be pulled, as a share of that length. */
  stretch: 0.12,
  /** How easily it gives at first, counted in steps: the inverse of its stiffness. */
  softness: STEPS_SQUARED / ROPE_STIFFNESS,
  /** The share of the speed along a taut strap that the strap takes away at each step. */
  damping: 0.08,
  /**
   * The share taken away from a stretched strap that is shortening. Webbing
   * creeps back to its length; it does not fire the badge like a catapult.
   */
  recoil: 0.45,
  /** A strap that snaps taut at this speed, or faster, has snapped as hard as it can. */
  snapSpeed: 3000,
  /** The hard stop holds a strap this far inside its limit, so that rounding never puts it past. */
  shortOfLimit: 1e-9,
} as const

/** The hand: firm, and softer than a strap at its limit, so the strap wins. */
export const HAND = {
  softness: STEPS_SQUARED / HAND_STIFFNESS,
  /** The share of the speed between the hand and the point it holds that is lost at each step. */
  damping: 0.33,
} as const

/** How quickly motion dies away, per second. */
export const AIR = {
  drift: 2.6,
  spin: 3.4,
  /** A slow badge loses its last movement quickly, as one rubbing on a lid does. */
  settling: 6,
  slowBelow: 60,
  /** Under reduced motion nothing swings: it moves as if through honey. */
  calm: 40,
  strap: 4,
} as const

/** When everything counts as still, and for how long before the simulation sleeps. */
export const REST = {
  speed: 2.5,
  strapSpeed: 8,
  after: 0.3,
  /** Asleep this close to where it hangs, the badge is put exactly there. */
  within: 0.75,
  angle: 0.003,
} as const

export const STRAP = {
  /** The pieces a strap is simulated in. */
  links: 10,
  /** How slack a strap must be, as a share of its length, before it feels its whole weight. */
  slackForWeight: 0.02,
  /** How many times its links are pulled to length at each step. */
  passes: 3,
} as const
