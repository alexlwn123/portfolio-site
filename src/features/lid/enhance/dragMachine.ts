import {
  add,
  clamp,
  length,
  mix,
  type Point,
  rotate,
  scale,
  type Size,
  subtract,
  ZERO,
} from './vector'

/*
 * Picking a sticker up, carrying it, throwing it and letting it stick again,
 * as a state machine. Every function takes a state and returns a new one:
 * nothing here changes what it is given, and nothing here touches the page.
 * dragDom.ts feeds it pointer events and frames, and draws what it says.
 *
 * Positions are in px from the lid's top left corner. Angles are in degrees,
 * clockwise.
 */

/** A sticker as the physics sees it. */
export interface Body {
  /** Its centre. */
  readonly at: Point
  /** Where its centre is when it is where the placement stuck it. */
  readonly home: Point
  /** Half its width and half its height. */
  readonly half: Point
  /** In px a second. */
  readonly velocity: Point
  /** How far it has swung from flat. */
  readonly angle: number
  /** In degrees a second. */
  readonly spin: number
}

export interface Press {
  readonly pointerType: string
  readonly button: number
  readonly at: Point
}

export type DragState =
  | { readonly phase: 'idle' }
  /** Pressed, and not yet moved far enough to count as more than a click. */
  | { readonly phase: 'pressed'; readonly start: Point; readonly grab: Point; readonly body: Body }
  /** In the hand. `grab` is the pinched point, measured from the sticker's centre. */
  | { readonly phase: 'held'; readonly pointer: Point; readonly grab: Point; readonly body: Body }
  /** Let go, and still sliding. `drop` is how fast it left the hand. */
  | { readonly phase: 'thrown'; readonly body: Body; readonly drop: number }
  /** Come to rest. Nothing more happens to it until it is pressed again. */
  | { readonly phase: 'stuck'; readonly body: Body; readonly drop: number }

export interface ReleaseOptions {
  /** True when nothing should move by itself: the sticker sticks where it is let go. */
  readonly calm?: boolean
  /** True when the browser took the pointer away: the sticker is dropped, not thrown. */
  readonly cancelled?: boolean
}

export const IDLE: DragState = Object.freeze({ phase: 'idle' })

/** A press that moves less than this is still a click. */
export const CLICK_SLOP_PX = 5

const SECOND_MS = 1000
/** The physics never takes a step longer than this, in seconds, however slow the frames. */
const MAX_STEP_S = 0.02

const SWING = {
  /** How hard the sticker is pulled towards the angle it hangs at. */
  stiffness: 120,
  /** How quickly its swinging dies away. */
  damping: 14,
  /** The angle it hangs at when pinched by its very edge. */
  hangDeg: 12,
  /** Degrees of lean for each px a second it is carried sideways. */
  sway: 0.012,
  maxSwayDeg: 16,
} as const

const THROW = {
  /** The share of the hand's speed a sticker keeps when it is let go. */
  keep: 0.5,
  maxSpeed: 2600,
  /** How quickly a sliding sticker slows, per second. */
  friction: 5,
  /** The share of its speed it keeps when it bounces off an edge of the lid. */
  bounce: 0.35,
  /** How quickly the hand's speed is believed, per frame. */
  smoothing: 0.4,
} as const

/** Slower, flatter and steadier than this, a thrown sticker has stuck. */
const AT_REST = { speed: 12, angleDeg: 0.3, spin: 4 } as const

/** A sticker lying still, a given distance from where it was stuck. */
export function restingBody(centre: Point, half: Point, offset: Point = ZERO): Body {
  return {
    at: centre,
    home: subtract(centre, offset),
    half,
    velocity: ZERO,
    angle: 0,
    spin: 0,
  }
}

/** How far a sticker is from where it was stuck. */
export function offsetOf({ at, home }: Body): Point {
  return subtract(at, home)
}

/** True while the sticker needs a frame: it is in the hand or sliding. */
export function isLoose(state: DragState): boolean {
  return state.phase === 'held' || state.phase === 'thrown'
}

/**
 * Where a sticker's centre may be: anywhere that keeps the whole of it on the
 * lid, and always as far out as its own home, so that one stuck over an edge
 * can go back there and no further.
 */
function onLid(at: Point, { home, half }: Body, lid: Size): Point {
  return {
    x: clamp(at.x, Math.min(half.x, home.x), Math.max(lid.width - half.x, home.x)),
    y: clamp(at.y, Math.min(half.y, home.y), Math.max(lid.height - half.y, home.y)),
  }
}

/**
 * The spring that swings the sticker towards an angle, over a length of time.
 * A slow frame is taken in several short steps, so the swing is the same
 * swing whatever the frame rate.
 */
function swing(body: Body, towards: number, dt: number): Pick<Body, 'angle' | 'spin'> {
  const short = Math.min(dt, MAX_STEP_S)
  const spin =
    body.spin + (SWING.stiffness * (towards - body.angle) - SWING.damping * body.spin) * short
  const swung = { angle: body.angle + spin * short, spin }
  return dt > short ? swing({ ...body, ...swung }, towards, dt - short) : swung
}

/** A mouse or pen button goes down on a sticker. Touch is left to scroll the page. */
export function press(state: DragState, { pointerType, button, at }: Press, body: Body): DragState {
  if (state.phase !== 'idle' || pointerType === 'touch' || button !== 0) {
    return state
  }
  return { phase: 'pressed', start: at, grab: subtract(at, body.at), body }
}

/** The pointer moves. Five px from where it went down, the sticker is picked up. */
export function move(state: DragState, at: Point): DragState {
  if (state.phase === 'held') {
    return { ...state, pointer: at }
  }
  if (state.phase !== 'pressed' || length(subtract(at, state.start)) < CLICK_SLOP_PX) {
    return state
  }
  return { phase: 'held', pointer: at, grab: state.grab, body: state.body }
}

/** The button comes up. A sticker in the hand is thrown with some of the hand's speed. */
export function release(
  state: DragState,
  { calm = false, cancelled = false }: ReleaseOptions = {},
): DragState {
  if (state.phase === 'pressed') {
    return IDLE
  }
  if (state.phase !== 'held') {
    return state
  }
  if (calm) {
    return { phase: 'stuck', body: { ...state.body, velocity: ZERO, angle: 0, spin: 0 }, drop: 0 }
  }
  const kept = scale(state.body.velocity, cancelled ? 0 : THROW.keep)
  const speed = Math.min(length(kept), THROW.maxSpeed)
  const velocity = length(kept) > 0 ? scale(kept, speed / length(kept)) : ZERO
  return { phase: 'thrown', body: { ...state.body, velocity }, drop: speed }
}

type Held = Extract<DragState, { phase: 'held' }>
type Thrown = Extract<DragState, { phase: 'thrown' }>

/**
 * In the hand: the sticker hangs from the pinched point. Pinched off centre,
 * its heavy side swings down, and it leans back as it is carried sideways.
 */
function carry(state: Held, dt: number, lid: Size, calm: boolean): DragState {
  const { body, grab, pointer } = state
  const hang = -clamp(grab.x / Math.max(body.half.x, 1), -1, 1) * SWING.hangDeg
  const sway = clamp(body.velocity.x * SWING.sway, -SWING.maxSwayDeg, SWING.maxSwayDeg)
  const swung = calm ? { angle: 0, spin: 0 } : swing(body, hang + sway, dt)
  const at = onLid(subtract(pointer, rotate(grab, swung.angle)), body, lid)
  const speed = scale(subtract(at, body.at), 1 / dt)
  return {
    ...state,
    body: { ...body, ...swung, at, velocity: mix(body.velocity, speed, THROW.smoothing) },
  }
}

/** One axis of a slide: it turns back from an edge with some of its speed. */
function slide(at: number, speed: number, low: number, high: number): readonly [number, number] {
  if (at < low) {
    return [Math.min(low + (low - at) * THROW.bounce, high), -speed * THROW.bounce]
  }
  if (at > high) {
    return [Math.max(high - (at - high) * THROW.bounce, low), -speed * THROW.bounce]
  }
  return [at, speed]
}

/** Let go: the sticker slides, slows, bounces softly off the lid's edges and swings flat. */
function fly(state: Thrown, dt: number, lid: Size): DragState {
  const { body } = state
  const slowed = scale(body.velocity, Math.exp(-THROW.friction * dt))
  const reached = add(body.at, scale(slowed, dt))
  const [low, high] = [
    onLid({ x: -Infinity, y: -Infinity }, body, lid),
    onLid({ x: Infinity, y: Infinity }, body, lid),
  ]
  const [x, speedX] = slide(reached.x, slowed.x, low.x, high.x)
  const [y, speedY] = slide(reached.y, slowed.y, low.y, high.y)
  const swung = swing(body, 0, dt)
  const next = { ...body, ...swung, at: { x, y }, velocity: { x: speedX, y: speedY } }
  const still =
    length(next.velocity) < AT_REST.speed &&
    Math.abs(next.angle) < AT_REST.angleDeg &&
    Math.abs(next.spin) < AT_REST.spin

  return still
    ? { phase: 'stuck', body: { ...next, velocity: ZERO, angle: 0, spin: 0 }, drop: state.drop }
    : { ...state, body: next }
}

/** One frame. Only a sticker in the hand or in flight changes. */
export function step(state: DragState, dtMs: number, lid: Size, calm = false): DragState {
  const dt = dtMs / SECOND_MS
  if (dt <= 0) {
    return state
  }
  if (state.phase === 'held') {
    return carry(state, dt, lid, calm)
  }
  if (state.phase !== 'thrown') {
    return state
  }
  // A slow frame is flown in several short steps: the same flight at any frame rate.
  const short = Math.min(dt, MAX_STEP_S)
  const flown = fly(state, short, lid)
  return dt > short ? step(flown, (dt - short) * SECOND_MS, lid, calm) : flown
}
