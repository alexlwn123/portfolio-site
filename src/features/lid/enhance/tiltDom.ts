import type { Env, Orientation } from './env'
import type { LightLoop } from './lightLoop'
import { createStore, type Store } from './store'
import { type Reading, seen, tilt, TILT_START, type TiltState } from './tilt'
import { RAD_PER_DEG } from './vector'

/*
 * The "tilt me" sticker. It shows only where tilting can do something: on a
 * touch device that reports its orientation, when the lamp is free to move.
 * Pressing it is the user gesture iOS wants before it will give readings.
 * Pressed again, it lets go of the lamp.
 */

interface Model {
  readonly tilt: TiltState
  /** The way to stop the readings, while they are coming. */
  readonly stop: (() => void) | null
}

export interface TiltHooks {
  /** The phone leans across by this many radians, clockwise, from how it was held: 0 when tilt stops. */
  readonly onLean?: (radians: number) => void
}

interface Context {
  readonly hooks: TiltHooks
  readonly button: HTMLElement
  readonly doc: Document
  readonly loop: LightLoop
  readonly orientation: Orientation
  readonly model: Store<Model>
  /** Run when the tab is hidden or shown. One function, so that it can be taken off again. */
  readonly onVisibility: () => void
}

function hide(button: HTMLElement): void {
  button.setAttribute('hidden', '')
}

/** Stops listening to the phone and gives the lamp back to its drift. */
function end({ button, doc, loop, model, onVisibility, hooks }: Context): void {
  hooks.onLean?.(0)
  model.get().stop?.()
  model.set({ ...model.get(), stop: null })
  doc.removeEventListener('visibilitychange', onVisibility)
  button.setAttribute('aria-pressed', 'false')
  loop.drift()
}

function onReading(context: Context, reading: Reading): void {
  const { loop, model, orientation, button } = context
  const next = tilt(model.get().tilt, reading, orientation.screenAngle())
  model.set({ ...model.get(), tilt: next.state })
  if (next.lamp === null) {
    // An event with nothing in it: a device with no sensor behind the API.
    end(context)
    hide(button)
    return
  }
  loop.follow(next.lamp)
  context.hooks.onLean?.(next.lean * RAD_PER_DEG)
}

function begin(context: Context): void {
  const { button, doc, model, orientation, onVisibility } = context
  const stop = orientation.listen((reading) => {
    onReading(context, reading)
  })
  model.set({ tilt: TILT_START, stop })
  doc.addEventListener('visibilitychange', onVisibility)
  button.setAttribute('aria-pressed', 'true')
}

/** The press: lets go of the lamp if tilt is on, and otherwise asks the phone for motion. */
function onPress(context: Context): void {
  const { button, model, orientation } = context
  if (model.get().stop !== null) {
    end(context)
    return
  }
  orientation
    .ask()
    .then((allowed) => {
      if (allowed) {
        begin(context)
      } else {
        hide(button)
      }
    })
    .catch(() => {
      // Refused, or asked outside a gesture: the lamp keeps to the pointer.
      hide(button)
    })
}

export function installTilt(
  lid: HTMLElement,
  env: Env,
  loop: LightLoop | null,
  hooks: TiltHooks = {},
  doc: Document = lid.ownerDocument,
): void {
  const button = lid.querySelector<HTMLElement>('[data-control="tilt"]')
  const { orientation } = env
  if (!button || !loop || !env.touch || orientation === null) {
    return
  }
  const model = createStore<Model>({ tilt: TILT_START, stop: null })
  const onVisibility = (): void => {
    model.set({ ...model.get(), tilt: seen(model.get().tilt, doc.visibilityState) })
  }
  const context: Context = { hooks, button, doc, loop, orientation, model, onVisibility }

  button.addEventListener('click', () => {
    onPress(context)
  })
  button.removeAttribute('hidden')
}
