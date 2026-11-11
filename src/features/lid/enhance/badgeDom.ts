import { ease } from '../../badge/physics/calm'
import { dropped, tossed } from '../../badge/physics/entrance'
import { createHang, type Hang } from '../../badge/physics/hang'
import { advance, type Push, resting, type Sim, wake } from '../../badge/physics/sim'
import { clearHang, drawHang } from './badgeDraw'
import {
  findHang,
  type HangParts,
  type Measured,
  measureHang,
  sameRig,
  turnOf,
} from './badgeMeasure'
import type { Env } from './env'
import { createStore, type Store } from './store'
import type { Task, Ticker } from './ticker'
import { length, mix, type Point, scale, subtract, turn, ZERO } from './vector'

/*
 * The badge on its lanyard, worked by hand. The physics (badge/physics/)
 * decides where everything is; this file hands it the pointer and the frames,
 * and draws its answer (badgeDraw.ts). Frames are asked for only while the
 * badge moves: asleep where it hangs, it is the static page again.
 *
 * A press on the card that moves no further than a few px is a click, and
 * the ribbon under it is followed. One that moves further takes hold of the
 * badge by the point that was pressed, and the click it ends with is eaten.
 */

export interface BadgeHooks {
  /** The straps have snapped taut. Strength is from 0 to 1, pan from -1 (left) to 1 (right). */
  readonly onSnap?: (strength: number, pan: number) => void
}

export interface BadgeControl {
  /** Puts the badge back where it hangs, still. */
  readonly tidy: () => void
  /** Leans gravity, in radians clockwise: a tilted phone. */
  readonly lean: (radians: number) => void
}

/** A press on the card, and the hold it may become. */
interface Hand {
  readonly pointerId: number
  /** Where the press went down, and where the pointer is now, on the screen. */
  readonly start: Point
  readonly pointer: Point
  /** Where the hand was, in units, at the last frame: null before the first. */
  readonly was: Point | null
  /** False until the press has moved far enough to be a hold. */
  readonly held: boolean
  /** The point of the badge held, from its middle as it hangs, in units. */
  readonly at: Point
  /** How fast the hand moves, in units a second. */
  readonly speed: Point
}

interface Model {
  readonly hang: Hang
  readonly measured: Measured
  readonly sim: Sim
  /** True while the badge eases home under reduced motion. */
  readonly easing: boolean
  readonly hand: Hand | null
  /** The lanyard drawing's top left corner on the screen. */
  readonly origin: Point
  readonly lean: number
  /** True when the next click on the card ends a hold, and is not a click. */
  readonly dragged: boolean
}

interface Context {
  readonly parts: HangParts
  readonly win: Window
  readonly calm: boolean
  readonly hooks: BadgeHooks
  readonly model: Store<Model>
  readonly ticker: Ticker
  readonly task: Task
  readonly followers: Readonly<Record<'move' | 'up' | 'cancel', (event: PointerEvent) => void>>
}

/** A press that moves this far, in px, takes hold. */
const SLOP_PX = 6
/** Units the badge falls from, above where it hangs, when nothing has been painted. */
const DROP_HEIGHT = 700
const MS_PER_S = 1000
/** How much of each new reading of the hand's speed is taken: the rest is the old one. */
const SPEED_BLEND = 0.5
/** A snap softer than this is not heard, and one that is is played at this share of its strength. */
const SNAP_HEARD = 0.2
const SNAP_VOLUME = 0.6
/** A change of lean smaller than this, in radians, is a trembling hand. */
const LEAN_STEP = 0.004
const PASSIVE = { passive: true } as const

function originOf({ lanyard }: HangParts): Point {
  const { left, top } = lanyard.getBoundingClientRect()
  return { x: left, y: top }
}

function toUnits({ origin, measured }: Model, client: Point): Point {
  return scale(subtract(client, origin), 1 / measured.unitPx)
}

function pointOf(event: PointerEvent): Point {
  return { x: event.clientX, y: event.clientY }
}

/** True when the badge is asleep exactly where the page draws it. */
function atRest({ sim, hang }: Model): boolean {
  const { at, angle } = sim.body
  return sim.asleep && at.x === hang.home.x && at.y === hang.home.y && angle === 0
}

function show({ parts }: Context, model: Model): void {
  if (atRest(model)) {
    clearHang(parts)
  } else {
    drawHang(parts, model.hang, model.measured, model.sim)
  }
}

/** The hand as it is this frame: where it is, in units, and how fast it has been moving. */
function handNow(model: Model, seconds: number): Hand | null {
  const { hand } = model
  if (hand?.held !== true || seconds <= 0) {
    return hand
  }
  const to = toUnits(model, hand.pointer)
  const reading = hand.was === null ? ZERO : scale(subtract(to, hand.was), 1 / seconds)
  return { ...hand, was: to, speed: mix(hand.speed, reading, SPEED_BLEND) }
}

function pushOf(model: Model, calm: boolean): Push {
  const { hand } = model
  const grab =
    hand?.held === true
      ? { at: hand.at, to: toUnits(model, hand.pointer), speed: hand.speed }
      : null
  return { grab, lean: model.lean, calm }
}

/** One frame. False once the badge is asleep and out of the hand. */
function frame(context: Context, dtMs: number): boolean {
  const before = context.model.get()
  const seconds = dtMs / MS_PER_S
  const model = { ...before, hand: handNow(before, seconds) }
  const sim = model.easing
    ? ease(model.hang, model.sim, seconds)
    : advance(model.hang, model.sim, pushOf(model, context.calm), seconds)
  if (sim.snap > SNAP_HEARD) {
    context.hooks.onSnap?.(sim.snap * SNAP_VOLUME, 0)
  }
  const next = { ...model, sim, easing: model.easing && !sim.asleep }
  context.model.set(next)
  show(context, next)
  return !sim.asleep || next.hand?.held === true
}

/** Sets the badge moving, and the frames going. */
function rouse(context: Context, change: Partial<Model> = {}): void {
  const model = context.model.get()
  context.model.set({ ...model, ...change, sim: wake(change.sim ?? model.sim) })
  context.ticker.run(context.task)
}

function follow({ win, followers }: Context, on: boolean): void {
  if (on) {
    win.addEventListener('pointermove', followers.move, PASSIVE)
    win.addEventListener('pointerup', followers.up, PASSIVE)
    win.addEventListener('pointercancel', followers.cancel, PASSIVE)
    return
  }
  win.removeEventListener('pointermove', followers.move)
  win.removeEventListener('pointerup', followers.up)
  win.removeEventListener('pointercancel', followers.cancel)
}

function pressDown(context: Context, event: PointerEvent): void {
  const model = { ...context.model.get(), dragged: false }
  context.model.set(model)
  if (model.hand !== null || (event.pointerType === 'mouse' && event.button !== 0)) {
    return
  }
  const at = pointOf(event)
  const hand = { pointerId: event.pointerId, start: at, pointer: at, was: null }
  context.model.set({ ...model, hand: { ...hand, held: false, at: ZERO, speed: ZERO } })
  follow(context, true)
}

/** The press has moved far enough: the badge is taken by the point that was pressed. */
function takeHold(context: Context, hand: Hand): Hand {
  const model = { ...context.model.get(), origin: originOf(context.parts) }
  const { body } = model.sim
  const at = turn(subtract(toUnits(model, hand.start), body.at), -body.angle)
  try {
    context.parts.card.setPointerCapture(hand.pointerId)
  } catch {
    // No capture: the window's listeners follow the pointer just the same.
  }
  context.parts.badge.setAttribute('data-hang-held', '')
  const held = { ...hand, held: true, at }
  rouse(context, { origin: model.origin, hand: held, easing: false })
  return held
}

function pointerMoved(context: Context, event: PointerEvent): void {
  const { hand } = context.model.get()
  if (hand?.pointerId !== event.pointerId) {
    return
  }
  const pointer = pointOf(event)
  if (!hand.held && length(subtract(pointer, hand.start)) <= SLOP_PX) {
    return
  }
  const holding = hand.held ? hand : takeHold(context, hand)
  context.model.set({ ...context.model.get(), hand: { ...holding, pointer } })
}

function letGo(context: Context, event: PointerEvent, cancelled: boolean): void {
  const model = context.model.get()
  if (model.hand?.pointerId !== event.pointerId) {
    return
  }
  follow(context, false)
  if (!model.hand.held) {
    context.model.set({ ...model, hand: null })
    return
  }
  context.parts.badge.removeAttribute('data-hang-held')
  rouse(context, { hand: null, dragged: !cancelled, easing: context.calm })
}

/** The click a hold ends with is not a click: the ribbon under it is not followed. */
function endOfHold({ model }: Context, event: MouseEvent): void {
  if (model.get().dragged) {
    event.preventDefault()
    event.stopPropagation()
  }
  model.set({ ...model.get(), dragged: false })
}

/** Back where it hangs, still, out of the hand, with nothing asked of the frames. */
function putBack(context: Context, hang: Hang, measured: Measured): void {
  const model = context.model.get()
  follow(context, false)
  context.ticker.drop(context.task)
  context.parts.badge.removeAttribute('data-hang-held')
  const next = {
    ...model,
    hang,
    measured,
    sim: resting(hang),
    hand: null,
    easing: false,
    dragged: false,
  }
  context.model.set(next)
  show(context, next)
}

/** Measures the page again. A change of scale alone keeps the badge moving; a new place puts it back. */
function remeasure(context: Context): void {
  const measured = measureHang(context.parts)
  const model = context.model.get()
  if (measured === null) {
    return
  }
  if (sameRig(measured.rig, model.measured.rig)) {
    context.model.set({ ...model, measured, origin: originOf(context.parts) })
    return
  }
  const hang = createHang(measured.rig)
  if (hang !== null) {
    putBack(context, hang, measured)
  }
}

function leanTo(context: Context, radians: number): void {
  const model = context.model.get()
  if (context.calm || Math.abs(radians - model.lean) < LEAN_STEP) {
    return
  }
  rouse(context, { lean: radians, easing: false })
}

/** How the badge arrives: still under reduced motion, else dropped in, or tossed if already shown. */
function arrival(env: Env, hang: Hang, sway: number): Sim {
  if (env.reducedMotion) {
    return resting(hang)
  }
  return env.painted() ? tossed(hang, sway) : dropped(hang, DROP_HEIGHT)
}

function listen(context: Context, env: Env): void {
  const { card } = context.parts
  const onResize = (): void => {
    remeasure(context)
  }
  card.addEventListener(
    'pointerdown',
    (event) => {
      pressDown(context, event)
    },
    PASSIVE,
  )
  card.addEventListener(
    'click',
    (event) => {
      endOfHold(context, event)
    },
    true,
  )
  card.addEventListener('dragstart', (event) => {
    event.preventDefault()
  })
  env.onRearrange(onResize)
  context.win.addEventListener('resize', onResize, PASSIVE)
}

function contextOf(
  parts: HangParts,
  env: Env,
  ticker: Ticker,
  hooks: BadgeHooks,
  model: Store<Model>,
): Context {
  const context: Context = {
    parts,
    win: parts.card.ownerDocument.defaultView ?? window,
    calm: env.reducedMotion,
    hooks,
    model,
    ticker,
    task: {
      measure: () => {
        model.set({ ...model.get(), origin: originOf(parts) })
      },
      update: (dtMs) => frame(context, dtMs),
    },
    followers: {
      move: (event) => {
        pointerMoved(context, event)
      },
      up: (event) => {
        letGo(context, event, false)
      },
      cancel: (event) => {
        letGo(context, event, true)
      },
    },
  }
  return context
}

/** Hangs the badge on the lid from its lanyard. Null, and the lid left as it was, when it cannot. */
export function installBadge(
  lid: HTMLElement,
  env: Env,
  ticker: Ticker,
  hooks: BadgeHooks = {},
): BadgeControl | null {
  const parts = findHang(lid)
  const measured = parts && measureHang(parts)
  const hang = measured && createHang(measured.rig)
  if (!parts || !measured || !hang) {
    return null
  }
  const sway = turnOf(parts.badge)
  for (const element of [parts.lanyard, parts.badge]) {
    element.setAttribute('data-hang', '')
  }
  const sim = arrival(env, hang, sway)
  const model = createStore<Model>({
    hang,
    measured,
    sim,
    easing: false,
    hand: null,
    origin: originOf(parts),
    lean: 0,
    dragged: false,
  })
  const context = contextOf(parts, env, ticker, hooks, model)
  listen(context, env)
  if (!sim.asleep) {
    show(context, model.get())
    ticker.run(context.task)
  }
  return {
    tidy: () => {
      putBack(context, model.get().hang, model.get().measured)
    },
    lean: (radians) => {
      leanTo(context, radians)
    },
  }
}
