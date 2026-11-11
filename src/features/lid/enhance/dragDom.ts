import {
  type Body,
  type DragState,
  IDLE,
  move,
  offsetOf,
  press,
  release,
  restingBody,
  step,
} from './dragMachine'
import type { Env } from './env'
import { createStore, type Store } from './store'
import { clearVars, setVars } from './style'
import type { Task, Ticker } from './ticker'
import { add, type Point, type Rect, scale, subtract, ZERO } from './vector'

/*
 * Picking stickers up with a mouse or a pen. dragMachine.ts decides what
 * happens. This file hands it the pointer and the frames, and draws its
 * answer as four custom properties on the sticker (see Sticker.module.css):
 * --dx and --dy, --swing and --front, with data-carry saying what the sticker
 * is doing.
 *
 * It listens on the lid for a press, and on the window only between a press
 * and its release. Everything is read from the page before anything is
 * written to it: the lid's box at the top of each frame, the sticker's when
 * it is pressed.
 */

export interface DragHooks {
  /** A sticker has left the lid in someone's hand. */
  readonly onLift?: () => void
  /** A sticker has stuck. Speed is from 0 to 1, pan from -1 (left) to 1 (right). */
  readonly onDrop?: (speed: number, pan: number) => void
}

export interface Drag {
  /** Puts every sticker back where the placement stuck it. */
  readonly tidy: () => void
}

/** The press or the carry in progress. Only one pointer has a sticker at a time. */
interface Grip {
  readonly sticker: HTMLElement
  readonly pointerId: number
  readonly state: DragState
}

interface Model {
  readonly grip: Grip | null
  /** Stickers that have been thrown and have not stuck yet. */
  readonly flying: ReadonlyMap<HTMLElement, DragState>
  /** Where each moved sticker lies, as shares of the lid's width from its home. */
  readonly lying: ReadonlyMap<HTMLElement, Point>
  /** The lid's box on the screen, as last read. */
  readonly lidBox: Rect
  /** Where the pointer is on the screen. */
  readonly pointer: Point
  /** The layer the last sticker to be lifted was put on. */
  readonly front: number
  /** The sticker whose next click is the end of a drag, not a click. */
  readonly dragged: HTMLElement | null
}

/** The handlers that follow a pressed pointer across the window. */
interface Followers {
  readonly move: (event: PointerEvent) => void
  readonly up: (event: PointerEvent) => void
  readonly cancel: (event: PointerEvent) => void
}

interface Context {
  readonly lid: HTMLElement
  readonly win: Window
  /** True when nothing should move by itself. */
  readonly calm: boolean
  readonly hooks: DragHooks
  readonly model: Store<Model>
  readonly ticker: Ticker
  /** What runs each frame while a sticker is in the hand or in flight. */
  readonly task: Task
  readonly followers: Followers
}

type Stuck = Extract<DragState, { phase: 'stuck' }>

const VARS = ['--dx', '--dy', '--swing', '--front'] as const
/** A carried sticker lies above every sticker that has not been touched. */
const FRONT_START = 50
/** A drop at this speed, in px a second, is as loud as a drop gets. */
const LOUDEST_DROP = 1400
const SHARE_DECIMALS = 5
const ANGLE_DECIMALS = 2
const PASSIVE = { passive: true } as const

/** Follows the pointer across the whole window, from a press to its release. */
function follow({ win, followers }: Context): void {
  win.addEventListener('pointermove', followers.move, PASSIVE)
  win.addEventListener('pointerup', followers.up, PASSIVE)
  win.addEventListener('pointercancel', followers.cancel, PASSIVE)
}

function unfollow({ win, followers }: Context): void {
  win.removeEventListener('pointermove', followers.move)
  win.removeEventListener('pointerup', followers.up)
  win.removeEventListener('pointercancel', followers.cancel)
}

function rounded(value: number, decimals: number): string {
  return String(Number(value.toFixed(decimals)))
}

function pointOf(event: PointerEvent): Point {
  return { x: event.clientX, y: event.clientY }
}

/** A point on the screen, measured from the lid's top left corner. */
function onLid(at: Point, { left, top }: Rect): Point {
  return subtract(at, { x: left, y: top })
}

/** A distance in px as a share of the lid's width, which is how it is kept and drawn. */
function share(distance: Point, { width }: Rect): Point {
  return scale(distance, 1 / Math.max(width, 1))
}

function capture(sticker: HTMLElement, pointerId: number): void {
  try {
    sticker.setPointerCapture(pointerId)
  } catch {
    // No capture: the window's listeners follow the pointer just the same.
  }
}

function draw(sticker: HTMLElement, body: Body, lidBox: Rect): void {
  const offset = share(offsetOf(body), lidBox)
  setVars(sticker, {
    '--dx': rounded(offset.x, SHARE_DECIMALS),
    '--dy': rounded(offset.y, SHARE_DECIMALS),
    '--swing': `${rounded(body.angle, ANGLE_DECIMALS)}deg`,
  })
}

/** Draws a sticker stuck down where it stopped, and says how hard it landed. */
function land({ hooks }: Context, sticker: HTMLElement, { body, drop }: Stuck, lidBox: Rect): void {
  draw(sticker, body, lidBox)
  clearVars(sticker, ['--swing'])
  sticker.setAttribute('data-carry', 'stuck')
  hooks.onDrop?.(Math.min(drop / LOUDEST_DROP, 1), share(body.at, lidBox).x * 2 - 1)
}

function isStuck(entry: readonly [HTMLElement, DragState]): entry is readonly [HTMLElement, Stuck] {
  return entry[1].phase === 'stuck'
}

/** One frame of the sticker in the hand, if there is one. */
function carry(context: Context, model: Model, dtMs: number): Grip | null {
  const { grip, lidBox, pointer } = model
  if (grip?.state.phase !== 'held') {
    return grip
  }
  const state = step(move(grip.state, onLid(pointer, lidBox)), dtMs, lidBox, context.calm)
  if (state.phase === 'held') {
    draw(grip.sticker, state.body, lidBox)
  }
  return { ...grip, state }
}

/** One frame for everything that is moving. False once nothing is. */
function frame(context: Context, dtMs: number): boolean {
  const model = context.model.get()
  const { lidBox } = model
  const grip = carry(context, model, dtMs)
  const stepped = [...model.flying].map(
    ([sticker, state]) => [sticker, step(state, dtMs, lidBox)] as const,
  )
  const stuck = stepped.filter(isStuck)
  const flying = stepped.filter((entry) => !isStuck(entry))
  const lying = stuck.map(
    ([sticker, { body }]) => [sticker, share(offsetOf(body), lidBox)] as const,
  )

  context.model.set({
    ...model,
    grip,
    flying: new Map(flying),
    lying: new Map([...model.lying, ...lying]),
  })
  for (const [sticker, state] of flying) {
    if (state.phase === 'thrown') {
      draw(sticker, state.body, lidBox)
    }
  }
  for (const [sticker, state] of stuck) {
    land(context, sticker, state, lidBox)
  }
  return grip?.state.phase === 'held' || flying.length > 0
}

/**
 * The sticker as the physics sees it now: caught in flight, or lying where it
 * was left. Its home is read from its layout box, which no transform moves.
 */
function bodyOf({ flying, lying, lidBox }: Model, sticker: HTMLElement): Body {
  const caught = flying.get(sticker)
  if (caught !== undefined && caught.phase !== 'idle') {
    return { ...caught.body, velocity: ZERO }
  }
  const box = sticker.getBoundingClientRect()
  const offset = scale(lying.get(sticker) ?? ZERO, lidBox.width)
  const home = {
    x: sticker.offsetLeft + sticker.offsetWidth / 2,
    y: sticker.offsetTop + sticker.offsetHeight / 2,
  }
  return restingBody(add(home, offset), { x: box.width / 2, y: box.height / 2 }, offset)
}

/** A button goes down on the lid. A mouse or a pen on a sticker is the start of a press. */
function pressDown(context: Context, event: PointerEvent): void {
  const before = { ...context.model.get(), dragged: null }
  const target = event.target instanceof Element ? event.target : null
  const sticker = target?.closest<HTMLElement>('[data-grab]')
  context.model.set(before)
  if (before.grip !== null || !sticker || target?.closest('[data-peel-tab], [data-note]')) {
    return
  }
  const model = { ...before, lidBox: context.lid.getBoundingClientRect(), pointer: pointOf(event) }
  const pressed = {
    pointerType: event.pointerType,
    button: event.button,
    at: onLid(model.pointer, model.lidBox),
  }
  const state = press(IDLE, pressed, bodyOf(model, sticker))
  if (state.phase !== 'pressed') {
    return
  }
  context.model.set({
    ...model,
    grip: { sticker, pointerId: event.pointerId, state },
    flying: new Map([...model.flying].filter(([other]) => other !== sticker)),
  })
  follow(context)
}

/** The sticker leaves the lid: it comes to the front and the frames start. */
function lift(context: Context, { sticker, pointerId }: Grip): void {
  const model = context.model.get()
  const front = model.front + 1
  capture(sticker, pointerId)
  sticker.setAttribute('data-carry', 'held')
  setVars(sticker, { '--front': String(front) })
  context.model.set({ ...model, front })
  context.hooks.onLift?.()
  context.ticker.run(context.task)
}

/** The pointer moves. Past five px from where it went down, the sticker is picked up. */
function pointerMoved(context: Context, event: PointerEvent): void {
  const model = context.model.get()
  if (model.grip?.pointerId !== event.pointerId) {
    return
  }
  const pointer = pointOf(event)
  const state = move(model.grip.state, onLid(pointer, model.lidBox))
  const grip = { ...model.grip, state }
  context.model.set({ ...model, pointer, grip })
  if (model.grip.state.phase === 'pressed' && state.phase === 'held') {
    lift(context, grip)
  }
}

/** The button comes up, or the browser takes the pointer away. */
function letGo(context: Context, event: PointerEvent, cancelled: boolean): void {
  const model = context.model.get()
  if (model.grip?.pointerId !== event.pointerId) {
    return
  }
  const { sticker, state } = model.grip
  const next = release(state, { calm: context.calm, cancelled })
  const offset = next.phase === 'stuck' ? share(offsetOf(next.body), model.lidBox) : null
  unfollow(context)
  context.model.set({
    ...model,
    grip: null,
    dragged: state.phase === 'held' && !cancelled ? sticker : null,
    flying: next.phase === 'thrown' ? new Map([...model.flying, [sticker, next]]) : model.flying,
    lying: offset === null ? model.lying : new Map([...model.lying, [sticker, offset]]),
  })
  if (next.phase === 'stuck') {
    land(context, sticker, next, model.lidBox)
  }
  if (next.phase === 'thrown') {
    sticker.setAttribute('data-carry', 'thrown')
    context.ticker.run(context.task)
  }
}

/** The click that a drag ends with is not a click: it must not follow the sticker's link. */
function endOfDrag({ model }: Context, event: MouseEvent): void {
  const { dragged } = model.get()
  if (dragged !== null && event.target instanceof Node && dragged.contains(event.target)) {
    event.preventDefault()
    event.stopPropagation()
  }
  model.set({ ...model.get(), dragged: null })
}

/** Stops the browser's own drag of a link or an image, which would take the pointer away. */
function noNativeDrag(event: Event): void {
  if (event.target instanceof Element && event.target.closest('[data-grab]')) {
    event.preventDefault()
  }
}

function tidy(context: Context): void {
  const model = context.model.get()
  const inHand = model.grip === null ? [] : [model.grip.sticker]
  for (const sticker of new Set([...model.lying.keys(), ...model.flying.keys(), ...inHand])) {
    sticker.removeAttribute('data-carry')
    clearVars(sticker, VARS)
  }
  unfollow(context)
  context.ticker.drop(context.task)
  context.model.set({
    ...model,
    grip: null,
    flying: new Map(),
    lying: new Map(),
    front: FRONT_START,
  })
}

/** The lid before anything on it has been touched. */
function untouched(lid: HTMLElement): Model {
  return {
    grip: null,
    flying: new Map(),
    lying: new Map(),
    lidBox: lid.getBoundingClientRect(),
    pointer: ZERO,
    front: FRONT_START,
    dragged: null,
  }
}

export function installDrag(
  lid: HTMLElement,
  env: Env,
  ticker: Ticker,
  hooks: DragHooks = {},
): Drag {
  const model = createStore(untouched(lid))
  const context: Context = {
    lid,
    win: lid.ownerDocument.defaultView ?? window,
    calm: env.reducedMotion,
    hooks,
    model,
    ticker,
    task: {
      measure: () => {
        model.set({ ...model.get(), lidBox: lid.getBoundingClientRect() })
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
  const onTidy = (): void => {
    tidy(context)
  }

  listen(context)
  env.onRearrange(onTidy)
  return { tidy: onTidy }
}

/** Listens on the lid for a press, for the click a drag ends with, and for a native drag. */
function listen(context: Context): void {
  const { lid } = context
  const onDown = (event: PointerEvent): void => {
    pressDown(context, event)
  }
  const onClick = (event: MouseEvent): void => {
    endOfDrag(context, event)
  }
  lid.addEventListener('pointerdown', onDown, PASSIVE)
  lid.addEventListener('click', onClick, true)
  lid.addEventListener('dragstart', noNativeDrag)
}
