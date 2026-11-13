import { CLICK_SLOP_PX } from './dragMachine'
import type { Env } from './env'
import {
  close,
  grab,
  isMoving,
  key,
  letGo,
  PEEL_START,
  type PeelState,
  progressOf,
  pull,
  settle,
  step,
  toggle,
} from './peelMachine'
import { createStore, type Store } from './store'
import { clearVars, setVars } from './style'
import type { Task, Ticker } from './ticker'
import { clamp, type Point, ZERO } from './vector'

/*
 * Peeling a sticker back to read the note under it. peelMachine.ts decides
 * what is open and how far. This file hands it presses, drags and keys, and
 * draws its answer on the sticker: data-peel while it is peeled at all,
 * --peel for how far, and aria-expanded on the corner (see
 * PeelSticker.module.css and Note.module.css).
 *
 * A sticker opens when it is pressed anywhere on its face or on its corner (a
 * click, Enter or Space), when the corner is dragged past halfway, or with
 * the arrow keys on the corner. It re-sticks when it is pressed again, on
 * Escape, on a press anywhere outside it, when focus moves on to something
 * else, and when another is opened.
 *
 * The face is a link in the markup, and stays one for a page with no script
 * and for a press that asks the browser for a new tab. With the script a
 * plain press on it peels the sticker instead of leaving the page: the links
 * in the note are the way to the site.
 */

export interface PeelHooks {
  /** A corner is moving. Speed is from 0 to 1. */
  readonly onPeel?: (speed: number) => void
}

export interface Peeler {
  /** Sticks the open sticker back down. */
  readonly close: () => void
}

/** The elements of one sticker that has a note under it. */
interface Parts {
  readonly sticker: HTMLElement
  readonly tab: HTMLElement
  /** The face: a link, and with the script what peels the sticker when it is pressed. */
  readonly face: HTMLElement | null
  readonly note: HTMLElement | null
}

/** A corner being dragged. */
interface Pull {
  readonly id: string
  readonly pointerId: number
  readonly start: Point
  /** How far the pointer travels, in px, to peel the sticker all the way. */
  readonly reach: number
  /** How far it was peeled when the corner was taken. Null until it has moved 5px. */
  readonly from: number | null
  /** When the pointer last moved, by the event clock. */
  readonly movedAt: number
}

interface Model {
  readonly peel: PeelState
  /** The stickers that carry data-peel now. */
  readonly drawn: readonly string[]
  /** How far each open note has been moved to keep it on the lid. */
  readonly nudges: ReadonlyMap<string, Point>
  readonly pulling: Pull | null
  /** The corner whose next click is the end of a drag, not a press. */
  readonly pulled: HTMLElement | null
}

/** The handlers that are listened with only some of the time. */
interface Followers {
  /** While a corner is being dragged. */
  readonly move: (event: PointerEvent) => void
  readonly up: (event: PointerEvent) => void
  /** While a sticker is open: a press anywhere on the page. */
  readonly press: (event: Event) => void
}

interface Context {
  readonly lid: HTMLElement
  readonly doc: Document
  readonly win: Window
  readonly parts: ReadonlyMap<string, Parts>
  /** True when nothing should move by itself. */
  readonly calm: boolean
  readonly hooks: PeelHooks
  readonly model: Store<Model>
  readonly ticker: Ticker
  /** What runs each frame while a corner springs open or shut. */
  readonly task: Task
  readonly followers: Followers
}

const VARS = ['--peel', '--note-x', '--note-y'] as const
/** The corner travels this share of the sticker's diagonal to peel it all the way. */
const REACH_SHARE = 0.6
/** A corner moving this fast, in peels a second, crackles at its highest. */
const FASTEST_PEEL = 6
/** A note is kept this far inside the lid's edge. */
const NOTE_MARGIN_PX = 12
const PEEL_DECIMALS = 3
const SECOND_MS = 1000
const SPACE = ' '
const PASSIVE = { passive: true } as const
const OUTSIDE = { capture: true, passive: true } as const

/** Follows the pointer that has a corner, from its press to its release. */
function follow({ win, followers }: Context): void {
  win.addEventListener('pointermove', followers.move, PASSIVE)
  win.addEventListener('pointerup', followers.up, PASSIVE)
  win.addEventListener('pointercancel', followers.up, PASSIVE)
}

function unfollow({ win, followers }: Context): void {
  win.removeEventListener('pointermove', followers.move)
  win.removeEventListener('pointerup', followers.up)
  win.removeEventListener('pointercancel', followers.up)
}

function partsOf(lid: HTMLElement): ReadonlyMap<string, Parts> {
  return new Map(
    [...lid.querySelectorAll<HTMLElement>('[data-peelable]')].flatMap((sticker) => {
      const tab = sticker.querySelector<HTMLElement>('[data-peel-tab]')
      const id = sticker.getAttribute('data-sticker')
      const note = sticker.querySelector<HTMLElement>('[data-note]')
      const face = sticker.querySelector<HTMLElement>('[data-peel-face]')
      return tab && id !== null ? [[id, { sticker, tab, face, note }] as const] : []
    }),
  )
}

/** The sticker whose corner an event happened on, if it happened on one. */
function idOf({ parts }: Context, target: EventTarget | null): string | null {
  const tab = target instanceof Element ? target.closest('[data-peel-tab]') : null
  return [...parts].find(([, each]) => each.tab === tab)?.[0] ?? null
}

/** The sticker whose face an event happened on, if it happened on one. */
function faceIdOf({ parts }: Context, target: EventTarget | null): string | null {
  const face = target instanceof Element ? target.closest('[data-peel-face]') : null
  if (face === null) {
    return null
  }
  return [...parts].find(([, each]) => each.face === face)?.[0] ?? null
}

/** A press with the main button and nothing held: not one that asks for a new tab or window. */
function isPlainPress(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function openParts({ parts, model }: Context): Parts | undefined {
  const { open } = model.get().peel
  return open === null ? undefined : parts.get(open)
}

/** How far to move a span so that it lies between two limits. */
function nudge(low: number, high: number, min: number, max: number): number {
  return high > max ? max - high : Math.max(min - low, 0)
}

/** Where a note must move to lie on the lid. It reads the page, so it runs before any write. */
function fit({ lid, parts, model }: Context, id: string): Point {
  const note = parts.get(id)?.note
  if (!note) {
    return ZERO
  }
  const box = note.getBoundingClientRect()
  const edge = lid.getBoundingClientRect()
  const moved = model.get().nudges.get(id) ?? ZERO
  const [left, top] = [box.left - moved.x, box.top - moved.y]
  const [right, bottom] = [edge.left + edge.width, edge.top + edge.height]
  return {
    x: nudge(left, left + box.width, edge.left + NOTE_MARGIN_PX, right - NOTE_MARGIN_PX),
    y: nudge(top, top + box.height, edge.top + NOTE_MARGIN_PX, bottom - NOTE_MARGIN_PX),
  }
}

/** Draws every sticker as the machine has it, and clears the ones that are stuck flat again. */
function draw({ parts, model }: Context): void {
  const { peel, drawn } = model.get()
  for (const id of drawn.filter((each) => !(each in peel.peels))) {
    const sticker = parts.get(id)?.sticker
    sticker?.removeAttribute('data-peel')
    if (sticker) {
      clearVars(sticker, VARS)
    }
  }
  for (const [id, { held, progress }] of Object.entries(peel.peels)) {
    const sticker = parts.get(id)?.sticker
    sticker?.setAttribute('data-peel', held ? 'held' : peel.open === id ? 'open' : 'closing')
    if (sticker) {
      setVars(sticker, { '--peel': String(Number(progress.toFixed(PEEL_DECIMALS))) })
    }
  }
  model.set({ ...model.get(), drawn: Object.keys(peel.peels) })
}

/** Tells the page which sticker is open now, and puts its note where it fits. */
function announce(context: Context, before: string | null, now: string | null): void {
  const { parts, model } = context
  const fitted = now === null ? null : fit(context, now)
  for (const [id, { tab, face, sticker }] of parts) {
    tab.setAttribute('aria-expanded', String(id === now))
    face?.setAttribute('aria-expanded', String(id === now))
    if (id === now && fitted !== null) {
      setVars(sticker, {
        '--note-x': `${String(Math.round(fitted.x))}px`,
        '--note-y': `${String(Math.round(fitted.y))}px`,
      })
      model.set({ ...model.get(), nudges: new Map([...model.get().nudges, [id, fitted]]) })
    }
  }
  if (before === null) {
    context.doc.addEventListener('pointerdown', context.followers.press, OUTSIDE)
  }
  if (now === null) {
    context.doc.removeEventListener('pointerdown', context.followers.press, true)
  }
}

/** Takes the machine's next state, draws it, and starts the frames if a corner has to move. */
function commit(context: Context, next: PeelState): void {
  const { model } = context
  const before = model.get().peel.open
  const peel = context.calm ? settle(next) : next
  model.set({ ...model.get(), peel })
  if (peel.open !== before) {
    announce(context, before, peel.open)
  }
  draw(context)
  if (isMoving(peel)) {
    context.ticker.run(context.task)
  }
}

function crackle({ hooks }: Context, speed: number): void {
  if (speed > 0) {
    hooks.onPeel?.(Math.min(speed / FASTEST_PEEL, 1))
  }
}

/** One frame of the springs. False once every corner is where it was going. */
function frame(context: Context, dtMs: number): boolean {
  const { model } = context
  const peel = step(model.get().peel, dtMs)
  model.set({ ...model.get(), peel })
  crackle(context, Math.max(0, ...Object.values(peel.peels).map(({ speed }) => Math.abs(speed))))
  draw(context)
  return isMoving(peel)
}

/** A mouse or pen button goes down on a corner: the start of a press, or of a pull. */
function cornerDown(context: Context, event: PointerEvent): void {
  const { model, parts } = context
  const id = idOf(context, event.target)
  const sticker = id === null ? undefined : parts.get(id)?.sticker
  const before = { ...model.get(), pulled: null }
  model.set(before)
  if (id === null || !sticker || before.pulling !== null) {
    return
  }
  if (event.pointerType === 'touch' || event.button !== 0) {
    return
  }
  const box = sticker.getBoundingClientRect()
  const pulling: Pull = {
    id,
    pointerId: event.pointerId,
    start: { x: event.clientX, y: event.clientY },
    reach: Math.max(Math.hypot(box.width, box.height) * REACH_SHARE, 1),
    from: null,
    movedAt: event.timeStamp,
  }
  model.set({ ...before, pulling })
  follow(context)
}

/** The pointer moves with a corner in it: the corner follows, towards the far corner. */
function cornerMoved(context: Context, event: PointerEvent): void {
  const { model } = context
  const { pulling, peel } = model.get()
  if (pulling?.pointerId !== event.pointerId) {
    return
  }
  const [dx, dy] = [pulling.start.x - event.clientX, pulling.start.y - event.clientY]
  if (pulling.from === null && Math.hypot(dx, dy) < CLICK_SLOP_PX) {
    return
  }
  const from = pulling.from ?? progressOf(peel, pulling.id)
  const taken = pulling.from === null ? grab(peel, pulling.id) : peel
  const progress = clamp(from + (dx + dy) / Math.SQRT2 / pulling.reach, 0, 1)
  const elapsedMs = Math.max(event.timeStamp - pulling.movedAt, 1)
  const speed = (Math.abs(progress - progressOf(taken, pulling.id)) * SECOND_MS) / elapsedMs

  model.set({ ...model.get(), pulling: { ...pulling, from, movedAt: event.timeStamp } })
  crackle(context, speed)
  commit(context, pull(taken, pulling.id, progress))
}

/** The corner is let go. A corner that never moved was a press, which the click handles. */
function cornerUp(context: Context, event: PointerEvent): void {
  const { model, parts } = context
  const { pulling, peel } = model.get()
  if (pulling?.pointerId !== event.pointerId) {
    return
  }
  const moved = pulling.from !== null
  unfollow(context)
  model.set({
    ...model.get(),
    pulling: null,
    pulled: moved ? (parts.get(pulling.id)?.tab ?? null) : null,
  })
  if (moved) {
    commit(context, letGo(peel, pulling.id))
  }
}

/** A corner is pressed: with a click, or with Enter or Space, which a button turns into one. */
function cornerPressed(context: Context, event: MouseEvent): void {
  const { model, parts } = context
  const id = idOf(context, event.target)
  if (id === null) {
    return
  }
  if (model.get().pulled === parts.get(id)?.tab) {
    model.set({ ...model.get(), pulled: null })
    event.preventDefault()
    return
  }
  commit(context, toggle(model.get().peel, id))
}

/**
 * The face is pressed. The sticker peels, or re-sticks, and the link the face
 * also is is not followed. The click that ends a drag of the sticker never
 * gets here: the drag keeps it (dragDom.ts).
 */
function facePressed(context: Context, event: MouseEvent): void {
  const id = faceIdOf(context, event.target)
  if (id === null || !isPlainPress(event)) {
    return
  }
  event.preventDefault()
  commit(context, toggle(context.model.get().peel, id))
}

/** Space on the face presses it, as it does a button. A link would scroll the page instead. */
function facePressedByKey(context: Context, event: KeyboardEvent): boolean {
  const id = event.key === SPACE ? faceIdOf(context, event.target) : null
  if (id === null) {
    return false
  }
  event.preventDefault()
  commit(context, toggle(context.model.get().peel, id))
  return true
}

function keyDown(context: Context, event: KeyboardEvent): void {
  const { model, doc } = context
  if (facePressedByKey(context, event)) {
    return
  }
  const focused = idOf(context, event.target)
  const open = openParts(context)
  const next = key(model.get().peel, event.key, focused)
  if (next === model.get().peel) {
    return
  }
  if (focused !== null) {
    // An arrow key on the corner peels the sticker. It must not also scroll the page.
    event.preventDefault()
  }
  const inNote = open?.note?.contains(doc.activeElement) === true
  commit(context, next)
  if (inNote && next.open === null) {
    // The note is about to be out of reach: focus goes back to the corner that opened it.
    open.tab.focus()
  }
}

/** A press or a focus has gone to something outside the open sticker: it re-sticks. */
function leftFor(context: Context, to: EventTarget | null): void {
  const sticker = openParts(context)?.sticker
  if (sticker && to instanceof Node && !sticker.contains(to)) {
    commit(context, close(context.model.get().peel))
  }
}

export function installPeel(
  lid: HTMLElement,
  env: Env,
  ticker: Ticker,
  hooks: PeelHooks = {},
): Peeler {
  const doc = lid.ownerDocument
  const context: Context = {
    lid,
    doc,
    win: doc.defaultView ?? window,
    parts: partsOf(lid),
    calm: env.reducedMotion,
    hooks,
    model: createStore<Model>({
      peel: PEEL_START,
      drawn: [],
      nudges: new Map(),
      pulling: null,
      pulled: null,
    }),
    ticker,
    task: { update: (dtMs) => frame(context, dtMs) },
    followers: {
      move: (event) => {
        cornerMoved(context, event)
      },
      up: (event) => {
        cornerUp(context, event)
      },
      press: (event) => {
        leftFor(context, event.target)
      },
    },
  }
  listen(context)
  return {
    close: () => {
      commit(context, close(context.model.get().peel))
    },
  }
}

/** Tells a reader the face is what peels the sticker now: a button that opens its note. */
function markAsControl(face: HTMLElement | null, note: HTMLElement | null): void {
  if (face === null) {
    return
  }
  face.setAttribute('role', 'button')
  face.setAttribute('aria-expanded', 'false')
  if (note !== null && note.id !== '') {
    face.setAttribute('aria-controls', note.id)
  }
}

/** Shows every corner and starts listening for what is done to them. */
function listen(context: Context): void {
  const { lid, doc, parts } = context
  const onDown = (event: PointerEvent): void => {
    cornerDown(context, event)
  }
  const onFocusOut = (event: FocusEvent): void => {
    leftFor(context, event.relatedTarget)
  }
  for (const { tab, face, note } of parts.values()) {
    tab.removeAttribute('hidden')
    markAsControl(face, note)
  }
  lid.addEventListener('pointerdown', onDown, PASSIVE)
  lid.addEventListener('focusout', onFocusOut, PASSIVE)
  lid.addEventListener('click', (event) => {
    cornerPressed(context, event)
    facePressed(context, event)
  })
  doc.addEventListener('keydown', (event) => {
    keyDown(context, event)
  })
}
