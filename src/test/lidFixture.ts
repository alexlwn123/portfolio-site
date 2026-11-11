import type { Env, Orientation, ScreenReport } from '../features/lid/enhance/env'
import type { Reading } from '../features/lid/enhance/tilt'
import { type FakeAudio, fakeAudio } from './fakeAudio'
import { type FakeFrames, fakeFrames, type FakeTimers, fakeTimers } from './fakeClock'

/*
 * A small lid for the tests of the script that works it: the same attributes
 * the real markup carries, a handful of stickers, and a browser that does
 * only what a test tells it to.
 */

const NOTED = ['pleb-fm', 'ncr-win'] as const

function peelable(id: string): string {
  return `
    <div data-sticker="${id}" data-grab data-peelable>
      <span>
        <a href="https://example.test/${id}">${id}</a>
        <button type="button" hidden data-peel-tab aria-expanded="false"
          aria-controls="${id}-note" aria-label="Peel back ${id}"></button>
      </span>
      <div id="${id}-note" data-note><a href="https://example.test/${id}/code">Code</a></div>
    </div>`
}

/** A strap as the page draws it: its line, and the stars that ride it. */
function strap(fixed: 'from' | 'to', id: string, line: string): string {
  return `
    <g data-strap="${fixed}">
      <defs><path id="${id}" data-strap-line d="${line}"></path></defs>
      <use href="#${id}"></use>
      <path data-strap-stars="0.25 0.75" d="M0 0L1 1"></path>
    </g>`
}

/** The lanyard, drawn on the same 260-unit square as the lid's, from the same points. */
export const LANYARD = `
  <div data-sticker="lanyard" aria-hidden="true">
    <svg viewBox="0 0 260 300" data-lanyard>
      ${strap('from', 'lanyard-left', 'M-96 -300L124 268')}
      ${strap('to', 'lanyard-right', 'M136 268L356 -300')}
    </svg>
  </div>`

const MARKUP = `
  <main data-lid-desk>
    <div data-lid>
      <svg>
        <linearGradient id="lid-foil" gradientTransform="at rest"></linearGradient>
      </svg>
      <div data-lid-stage>
        <h1 data-sticker="name" data-grab>
          <svg>
            <radialGradient id="name-glow" cx="168" cy="90"></radialGradient>
            <use fill="url(#lid-foil)"></use>
            <use fill="url(#name-glow)"></use>
          </svg>
        </h1>
        ${LANYARD}
        <div data-sticker="badge">
          <div data-badge-card><img alt="" src="photo.jpg"><nav><a href="/cv/#wins">Winner</a></nav></div>
        </div>
        <a data-sticker="cv" data-grab href="/cv/">Plain CV</a>
        ${NOTED.map(peelable).join('')}
        <a data-sticker="lightning-welder" data-grab href="/cv/#wins">
          <svg><polygon fill="url(#lid-foil)"></polygon></svg>
        </a>
        <div data-sticker="next-spot">saved</div>
        <button type="button" hidden data-sticker="tilt" data-grab data-control="tilt"
          aria-pressed="false">Tilt me</button>
        <button type="button" hidden data-sticker="sound" data-grab data-control="sound"
          aria-pressed="false" aria-label="Sound"></button>
        <button type="button" hidden data-sticker="tidy" data-grab data-control="tidy">
          Tidy the lid
        </button>
      </div>
    </div>
  </main>`

export interface Box {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** The lid's own box in every fixture: a thousand wide, at the top left of the screen. */
export const LID_BOX: Box = { left: 0, top: 0, width: 1000, height: 1800 }

/** Gives an element a place on the page, which jsdom never lays out. */
export function place(element: Element, box: Box): void {
  const rect = {
    ...box,
    right: box.left + box.width,
    bottom: box.top + box.height,
    x: box.left,
    y: box.top,
  }
  Object.defineProperties(element, {
    offsetLeft: { configurable: true, value: box.left },
    offsetTop: { configurable: true, value: box.top },
    offsetWidth: { configurable: true, value: box.width },
    offsetHeight: { configurable: true, value: box.height },
    getBoundingClientRect: { configurable: true, value: () => ({ ...rect, toJSON: () => rect }) },
  })
}

/**
 * Where the lanyard and the badge hang in every fixture: from one anchor, at
 * one px to the unit, with the card 236 by 470 below the clip.
 */
export const HANG_BOX: Box = { left: 400, top: 100, width: 260, height: 300 }
export const CARD_BOX: Box = { left: 12, top: 296, width: 236, height: 470 }

export function placeHang(lid: HTMLElement, box: Box = HANG_BOX): void {
  const lanyard = lid.querySelector('[data-sticker="lanyard"]')
  const badge = lid.querySelector('[data-sticker="badge"]')
  const card = lid.querySelector('[data-badge-card]')
  if (lanyard && badge && card) {
    place(lanyard, box)
    place(badge, box)
    place(card, CARD_BOX)
  }
}

export interface LidFixture {
  readonly lid: HTMLElement
  readonly sticker: (id: string) => HTMLElement
  readonly tab: (id: string) => HTMLElement
  readonly note: (id: string) => HTMLElement
  readonly control: (name: string) => HTMLElement
}

function find(root: ParentNode, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector)
  if (!found) {
    throw new Error(`The fixture has nothing that matches ${selector}`)
  }
  return found
}

/** Puts the small lid into the document, each sticker with a box of its own. */
export function lidFixture(): LidFixture {
  document.body.innerHTML = MARKUP
  const lid = find(document, '[data-lid]')
  const sticker = (id: string): HTMLElement => find(lid, `[data-sticker="${id}"]`)

  place(lid, LID_BOX)
  place(sticker('cv'), { left: 100, top: 400, width: 200, height: 100 })
  place(sticker('pleb-fm'), { left: 400, top: 800, width: 200, height: 100 })
  place(sticker('ncr-win'), { left: 700, top: 100, width: 100, height: 100 })
  place(sticker('name'), { left: 0, top: 0, width: 400, height: 250 })
  placeHang(lid)

  return {
    lid,
    sticker,
    tab: (id) => find(sticker(id), '[data-peel-tab]'),
    note: (id) => find(sticker(id), '[data-note]'),
    control: (name) => find(lid, `[data-control="${name}"]`),
  }
}

export interface FakeOrientation extends Orientation {
  /** Sends a reading to whoever is listening. */
  readonly send: (reading: Reading) => void
  readonly listening: () => boolean
  readonly asked: () => number
}

/** A phone's orientation sensor that answers the request for it as the test says. */
export function fakeOrientation(answer: boolean | Error = true, angle = 0): FakeOrientation {
  let listener: ((reading: Reading) => void) | null = null
  let asked = 0

  return {
    ask: () => {
      asked += 1
      return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer)
    },
    listen: (onReading) => {
      listener = onReading
      return () => {
        listener = null
      }
    },
    screenAngle: () => angle,
    send: (reading) => listener?.(reading),
    listening: () => listener !== null,
    asked: () => asked,
  }
}

export interface MemoryStorage {
  readonly getItem: (name: string) => string | null
  readonly setItem: (name: string, value: string) => void
  readonly items: () => Readonly<Record<string, string>>
}

export function memoryStorage(initial: Readonly<Record<string, string>> = {}): MemoryStorage {
  let items = { ...initial }
  return {
    getItem: (name) => items[name] ?? null,
    setItem: (name, value) => {
      items = { ...items, [name]: value }
    },
    items: () => items,
  }
}

export interface FakeEnv extends Env {
  readonly frames: FakeFrames
  readonly timers: FakeTimers
  readonly audio: FakeAudio
  /** Says that a watched element has come on screen, or gone off it. */
  readonly report: ScreenReport
  readonly watched: () => readonly Element[]
  /** Switches the lid between its two arrangements. */
  readonly rearrange: () => void
  /** How many audio contexts have been made. */
  readonly audioMade: () => number
}

/** A browser for tests. Motion is welcome and nothing is on screen until a test says so. */
export function fakeEnv(overrides: Partial<Env> = {}): FakeEnv {
  const audio = fakeAudio()
  let report: ScreenReport = () => undefined
  let watched: readonly Element[] = []
  let rearrangers: readonly (() => void)[] = []
  let audioMade = 0

  return {
    reducedMotion: false,
    touch: false,
    painted: () => false,
    frames: fakeFrames(),
    timers: fakeTimers(),
    storage: memoryStorage(),
    createAudio: () => {
      audioMade += 1
      return audio.context
    },
    onScreen: (callback) => {
      report = callback
      return {
        watch: (element) => {
          watched = [...watched, element]
        },
      }
    },
    orientation: null,
    onRearrange: (callback) => {
      rearrangers = [...rearrangers, callback]
    },
    ...overrides,
    audio,
    report: (element, onScreen) => {
      report(element, onScreen)
    },
    watched: () => watched,
    rearrange: () => {
      for (const callback of rearrangers) {
        callback()
      }
    },
    audioMade: () => audioMade,
  } as FakeEnv
}

interface PointerInit {
  readonly x?: number
  readonly y?: number
  readonly pointerType?: string
  readonly button?: number
  readonly pointerId?: number
  readonly relatedTarget?: EventTarget | null
}

/**
 * jsdom cannot follow a link, and says so on the console each time one is
 * clicked. This lets a click run its course, then stops it at the window.
 */
function goNowhere(event: Event): void {
  event.preventDefault()
}

/**
 * Sends a pointer event, as a mouse unless told otherwise. Returns the event,
 * with whether anything on the page stopped its default action.
 */
export function pointer(
  target: EventTarget,
  type: string,
  init: PointerInit = {},
): Event & { readonly stopped: boolean } {
  let verdict = null as boolean | null
  const judge = (event: Event): void => {
    verdict = event.defaultPrevented
    goNowhere(event)
  }
  window.addEventListener(type, judge, { once: true })
  const event = dispatchPointer(target, type, init)
  window.removeEventListener(type, judge)
  // An event that never reached the window was stopped on its way there.
  return Object.assign(event, { stopped: verdict ?? event.defaultPrevented })
}

function dispatchPointer(target: EventTarget, type: string, init: PointerInit): Event {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    button: init.button ?? 0,
    relatedTarget: init.relatedTarget ?? null,
  })
  Object.defineProperties(event, {
    pointerType: { value: init.pointerType ?? 'mouse' },
    pointerId: { value: init.pointerId ?? 1 },
  })
  target.dispatchEvent(event)
  return event
}

/** Presses on an element and drags to a point, ending with the button still down. */
export function dragFrom(
  target: Element,
  from: readonly [number, number],
  to: readonly [number, number],
): void {
  pointer(target, 'pointerdown', { x: from[0], y: from[1] })
  pointer(window, 'pointermove', { x: to[0], y: to[1] })
}
