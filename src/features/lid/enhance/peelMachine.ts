import { clamp } from './vector'

/*
 * Peeling stickers back, as a state machine. A sticker's peel runs from 0
 * (stuck flat) to 1 (peeled back as far as it goes). At most one sticker is
 * open at a time: the one named in `open` springs towards 1 and every other
 * springs back to 0. Every function returns a new state and changes nothing
 * it is given. peelDom.ts feeds it events and frames and draws what it says.
 */

export interface Peel {
  /** From 0, stuck flat, to 1, peeled back. */
  readonly progress: number
  /** How fast the corner is moving, in peels a second. Positive is opening. */
  readonly speed: number
  /** True while the corner is in the hand, and so follows the pointer. */
  readonly held: boolean
}

export interface PeelState {
  /** The sticker that is open, or opening. */
  readonly open: string | null
  /** Every sticker that is not stuck flat, by id. */
  readonly peels: Readonly<Record<string, Peel>>
}

export const PEEL_START: PeelState = Object.freeze({ open: null, peels: Object.freeze({}) })

/** A corner let go at or past this stays open. Before it, the sticker springs back. */
const HALFWAY = 0.5

const SPRING = { stiffness: 170, damping: 22 } as const
/** Closer and slower than this, a corner is where it was going. */
const SETTLED = { distance: 0.002, speed: 0.02 } as const

const SECOND_MS = 1000
/** The spring never takes a step longer than this, in seconds, however slow the frames. */
const MAX_STEP_S = 0.02
const STUCK: Peel = Object.freeze({ progress: 0, speed: 0, held: false })

const OPENING_KEYS: readonly string[] = ['ArrowUp', 'ArrowLeft']
const CLOSING_KEYS: readonly string[] = ['ArrowDown', 'ArrowRight']

function peelOf(state: PeelState, id: string): Peel {
  return state.peels[id] ?? STUCK
}

function withPeel(state: PeelState, id: string, peel: Peel): PeelState {
  return { ...state, peels: { ...state.peels, [id]: peel } }
}

function targetOf(state: PeelState, id: string): number {
  return state.open === id ? 1 : 0
}

function isAtRest(peel: Peel, target: number): boolean {
  return peel.progress === target && peel.speed === 0
}

/** How far a sticker is peeled. */
export function progressOf(state: PeelState, id: string): number {
  return peelOf(state, id).progress
}

/** True while a corner that is not in the hand has somewhere to go. */
export function isMoving(state: PeelState): boolean {
  return Object.entries(state.peels).some(
    ([id, peel]) => !peel.held && !isAtRest(peel, targetOf(state, id)),
  )
}

/** A corner is taken in the hand. */
export function grab(state: PeelState, id: string): PeelState {
  return withPeel(state, id, { ...peelOf(state, id), speed: 0, held: true })
}

/** The corner in the hand is pulled to a share of the way across. */
export function pull(state: PeelState, id: string, progress: number): PeelState {
  const peel = state.peels[id]
  if (!peel?.held) {
    return state
  }
  return withPeel(state, id, { ...peel, progress: clamp(progress, 0, 1) })
}

/** The corner is let go: past halfway it opens, and before it springs back. */
export function letGo(state: PeelState, id: string): PeelState {
  const peel = state.peels[id]
  if (!peel?.held) {
    return state
  }
  const stays = peel.progress >= HALFWAY
  const open = stays ? id : state.open === id ? null : state.open
  return withoutStuck(withPeel({ ...state, open }, id, { ...peel, held: false }))
}

/** Opens a sticker, which closes any other, or closes it if it is the open one. */
export function toggle(state: PeelState, id: string): PeelState {
  return state.open === id
    ? close(state)
    : withoutStuck(withPeel({ ...state, open: id }, id, peelOf(state, id)))
}

/**
 * Sticks the open sticker back down. One that had not begun to open is flat
 * already, and is forgotten at once: there will be no frame to forget it in.
 */
export function close(state: PeelState): PeelState {
  return state.open === null ? state : withoutStuck({ ...state, open: null })
}

/**
 * A key goes down. Escape re-sticks whatever is open. With a peeling corner
 * in focus, the arrows are the keyboard's way of pulling it: up or left
 * peels, down or right sticks it back.
 */
export function key(state: PeelState, pressed: string, focused: string | null): PeelState {
  if (pressed === 'Escape') {
    return close(state)
  }
  if (focused === null) {
    return state
  }
  if (OPENING_KEYS.includes(pressed)) {
    return state.open === focused ? state : toggle(state, focused)
  }
  return CLOSING_KEYS.includes(pressed) && state.open === focused ? close(state) : state
}

/**
 * The spring that carries a corner towards where it is going, over a length
 * of time. A slow frame is taken in several short steps, so the corner moves
 * the same way whatever the frame rate.
 */
function spring(peel: Peel, target: number, dt: number): Peel {
  const short = Math.min(dt, MAX_STEP_S)
  const sprung = springOnce(peel, target, short)
  return dt > short ? spring(sprung, target, dt - short) : sprung
}

function springOnce(peel: Peel, target: number, dt: number): Peel {
  const speed =
    peel.speed + (SPRING.stiffness * (target - peel.progress) - SPRING.damping * peel.speed) * dt
  const progress = clamp(peel.progress + speed * dt, 0, 1)
  const arrived = Math.abs(target - progress) < SETTLED.distance && Math.abs(speed) < SETTLED.speed
  if (arrived) {
    return { ...peel, progress: target, speed: 0 }
  }
  // A corner that reaches the end of its travel stops there.
  return { ...peel, progress, speed: progress === 0 || progress === 1 ? 0 : speed }
}

/** Drops the stickers that are stuck flat again: they need no record. */
function withoutStuck(state: PeelState): PeelState {
  const peels = Object.fromEntries(
    Object.entries(state.peels).filter(
      ([id, peel]) => peel.held || state.open === id || !isAtRest(peel, 0),
    ),
  )
  return { ...state, peels }
}

/** One frame: every corner that is not in the hand springs towards where it is going. */
export function step(state: PeelState, dtMs: number): PeelState {
  if (!isMoving(state) || dtMs <= 0) {
    return state
  }
  const peels = Object.fromEntries(
    Object.entries(state.peels).map(([id, peel]) => [
      id,
      peel.held ? peel : spring(peel, targetOf(state, id), dtMs / SECOND_MS),
    ]),
  )
  return withoutStuck({ ...state, peels })
}

/** Puts every corner that is not in the hand where it is going, at once. */
export function settle(state: PeelState): PeelState {
  const peels = Object.fromEntries(
    Object.entries(state.peels).map(([id, peel]) => [
      id,
      peel.held ? peel : { ...peel, progress: targetOf(state, id), speed: 0 },
    ]),
  )
  return withoutStuck({ ...state, peels })
}
