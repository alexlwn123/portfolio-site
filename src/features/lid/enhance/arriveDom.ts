import { type Pace, takeTurns } from './arrive'
import type { Env, Sighting, SightWatch } from './env'
import { createStore, type Store } from './store'
import { clearVars, setVars } from './style'
import type { Timers } from './ticker'
import { clamp } from './vector'

/*
 * Sticks things down as they scroll into view: the pile's stickers with a
 * slap, in a cascade, and a section's heading and stickers with a quick
 * press. arrive.ts decides who lands when. This file watches the page, holds
 * back what has not been seen yet and lets it go when it comes into view.
 *
 * Nothing is ever hidden by the stylesheet alone. A thing is held back only
 * here, only when motion is welcome, and only once the browser has said it is
 * off the screen: what is on screen when the page loads is never touched. If
 * anything goes wrong, everything held back is shown at once.
 *
 * It asks for no frames. The landing itself is a CSS animation, started by an
 * attribute (see Sticker.module.css and Stuck.module.css), and a timer takes
 * the attribute away again when it has played.
 */

export interface ArrivalHooks {
  /** A sticker of the pile has landed. Strength is from 0 to 1, pan from -1 (left) to 1 (right). */
  readonly onLand?: (strength: number, pan: number) => void
}

/** How a thing lands: slapped down as a sticker of the pile is, or pressed on in a section. */
type Kind = 'slap' | 'press'

interface Manner {
  readonly pace: Pace
  /** How long the stylesheet's animation runs, with a little to spare. */
  readonly lastsMs: number
}

interface Model {
  /** What has had its first sighting. */
  readonly met: ReadonlySet<Element>
  /** What is held back until it comes into view. */
  readonly waiting: ReadonlySet<Element>
  /** When each manner's last landing has had its gap. */
  readonly freeAtMs: Readonly<Record<Kind, number>>
  /** How many stickers of the pile have landed, and how many of those were heard. */
  readonly landed: number
  readonly heard: number
}

interface Context {
  readonly kinds: ReadonlyMap<Element, Kind>
  readonly watch: SightWatch
  readonly timers: Timers
  readonly now: () => number
  readonly width: () => number
  readonly hooks: ArrivalHooks
  readonly model: Store<Model>
}

const LAND = 'data-land'
const WAIT = 'wait'
const DELAY = '--land-delay'
const PILE_STICKERS = '[data-lid-pile] [data-sticker]'
/** A sticker stuck down in a section: src/features/sections/Stuck.tsx marks each one. */
const PRESSED = '[data-stuck]'

const MANNERS: Readonly<Record<Kind, Manner>> = {
  slap: { pace: { gapMs: 60, longestWaitMs: 480, rowPx: 48 }, lastsMs: 520 },
  press: { pace: { gapMs: 35, longestWaitMs: 210, rowPx: 48 }, lastsMs: 300 },
}

/** The pile's landings are heard for the first and every fifth after it, and five times at most. */
const HEARD = { every: 5, atMost: 5, strength: 0.3 } as const

const UNSEEN: Model = {
  met: new Set(),
  waiting: new Set(),
  freeAtMs: { slap: 0, press: 0 },
  landed: 0,
  heard: 0,
}

/** Everything that lands, with the manner it lands in. */
function candidates(doc: Document, lid: HTMLElement): ReadonlyMap<Element, Kind> {
  const slapped = [...lid.querySelectorAll(PILE_STICKERS)].map(
    (element) => [element, 'slap'] as const,
  )
  const pressed = [...doc.querySelectorAll(PRESSED)].map((element) => [element, 'press'] as const)
  return new Map<Element, Kind>([...slapped, ...pressed])
}

/** The page as it was before this file touched the element. */
function settle(element: Element): void {
  element.removeAttribute(LAND)
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    clearVars(element, [DELAY])
  }
}

/** Something went wrong: nothing stays hidden, and nothing more is watched. */
function giveUp({ kinds, watch, model }: Context): void {
  for (const element of kinds.keys()) {
    settle(element)
    watch.forget(element)
  }
  model.set({ ...model.get(), waiting: new Set() })
}

/** Where across the screen something is, from -1 at the left edge to 1 at the right. */
function panOf(left: number, width: number): number {
  return clamp((left / Math.max(width, 1)) * 2 - 1, -1, 1)
}

/** True for the landings that are heard: the first, and every fifth after it, up to the limit. */
function isHeard(landed: number, heard: number): boolean {
  return landed % HEARD.every === 0 && heard < HEARD.atMost
}

/** Starts one landing, and takes its marks off the page when it has played. */
function land(context: Context, element: Element, kind: Kind, delayMs: number): void {
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    setVars(element, { [DELAY]: `${String(delayMs)}ms` })
  }
  element.setAttribute(LAND, kind)
  context.watch.forget(element)
  context.timers.set(() => {
    settle(element)
  }, delayMs + MANNERS[kind].lastsMs)
}

/** Lets a landing be heard when it happens: at once, or after its delay. */
function sound({ hooks, timers }: Context, delayMs: number, pan: number): void {
  const play = (): void => {
    hooks.onLand?.(HEARD.strength, pan)
  }
  if (delayMs <= 0) {
    play()
    return
  }
  timers.set(play, delayMs)
}

/** Which of a batch of the pile's landings are heard, by their place in the batch. */
function heardOf(count: number, { landed, heard }: Model): readonly number[] {
  return Array.from({ length: count }, (_, index) => index).reduce<readonly number[]>(
    (soFar, index) => (isHeard(landed + index, heard + soFar.length) ? [...soFar, index] : soFar),
    [],
  )
}

/** Lands everything of one manner that has just come into view, each in its turn. */
function landAll(context: Context, kind: Kind, arriving: readonly Sighting[]): void {
  const model = context.model.get()
  const batch = arriving.map(({ element, left, top }) => ({ item: { element, left }, left, top }))
  const { turns, freeAtMs } = takeTurns(
    batch,
    context.now(),
    model.freeAtMs[kind],
    MANNERS[kind].pace,
  )
  const heard = kind === 'slap' ? heardOf(turns.length, model) : []

  for (const [index, { item, delayMs }] of turns.entries()) {
    land(context, item.element, kind, delayMs)
    if (heard.includes(index)) {
      sound(context, delayMs, panOf(item.left, context.width()))
    }
  }
  context.model.set({
    ...context.model.get(),
    freeAtMs: { ...model.freeAtMs, [kind]: freeAtMs },
    landed: model.landed + (kind === 'slap' ? turns.length : 0),
    heard: model.heard + heard.length,
  })
}

/**
 * One batch of sightings. What is seen for the first time is either showing
 * already, by so much as an edge, and left alone for good, or off the screen,
 * and held back. What was held back and is now on screen lands.
 */
function onSeen(context: Context, seen: readonly Sighting[]): void {
  const { kinds, watch, model } = context
  const before = model.get()
  const known = seen.filter(({ element }) => kinds.has(element))
  const fresh = known.filter(({ element }) => !before.met.has(element))
  const held = fresh.filter(({ showing }) => !showing).map(({ element }) => element)
  const arriving = known.filter(({ element, onScreen }) => onScreen && before.waiting.has(element))
  const gone = new Set(arriving.map(({ element }) => element))

  model.set({
    ...before,
    met: new Set([...before.met, ...fresh.map(({ element }) => element)]),
    waiting: new Set([...before.waiting, ...held].filter((element) => !gone.has(element))),
  })
  for (const { element, showing } of fresh) {
    if (showing) {
      watch.forget(element)
    } else {
      element.setAttribute(LAND, WAIT)
    }
  }
  for (const kind of ['slap', 'press'] as const) {
    landAll(
      context,
      kind,
      arriving.filter(({ element }) => kinds.get(element) === kind),
    )
  }
}

/**
 * Starts watching. It does nothing where motion is not welcome or the browser
 * cannot say what is in view: everything is then simply in place.
 */
export function installArrivals(
  doc: Document,
  lid: HTMLElement,
  env: Env,
  hooks: ArrivalHooks = {},
): void {
  if (env.reducedMotion || env.onSight === null) {
    return
  }
  const kinds = candidates(doc, lid)
  const model = createStore(UNSEEN)
  const watch = env.onSight((seen) => {
    try {
      onSeen(context, seen)
    } catch {
      giveUp(context)
    }
  })
  const context: Context = {
    kinds,
    watch,
    timers: env.timers,
    now: env.now,
    width: () => doc.defaultView?.innerWidth ?? 0,
    hooks,
    model,
  }
  for (const element of kinds.keys()) {
    watch.watch(element)
  }
}
