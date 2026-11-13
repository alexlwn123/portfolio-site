import type { Env } from './env'
import { readPreference, soundWanted, writePreference } from './preference'
import { createSound, type Sound } from './sound'

/*
 * The speaker sticker, and when the lid's sounds may play. Sound is off until
 * the visitor presses the speaker. The choice is remembered, but a remembered
 * "on" makes no sound until the visitor does something: a browser lets audio
 * start only from a user gesture.
 */

/** The events that count as a gesture for every kind of pointer, and for the keyboard. */
const GESTURES = ['mousedown', 'keydown'] as const
/** Keys a browser does not take as a gesture. Audio asked for on one of them would not start. */
const NOT_A_GESTURE: readonly string[] = ['Shift', 'Control', 'Alt', 'Meta', 'Escape']

/** Unlocks the audio at the visitor's first gesture, then stops listening. */
function unlockOnGesture(win: Window, sound: Sound): void {
  const unlock = (event: Event): void => {
    if (event instanceof KeyboardEvent && NOT_A_GESTURE.includes(event.key)) {
      return
    }
    sound.unlock()
    for (const gesture of GESTURES) {
      win.removeEventListener(gesture, unlock, true)
    }
  }
  for (const gesture of GESTURES) {
    win.addEventListener(gesture, unlock, { capture: true, passive: true })
  }
}

/** A quiet tick as the pointer or the keyboard arrives at one of the badge's ribbons. */
function tickOnBadge(lid: HTMLElement, sound: Sound): void {
  const badge = lid.querySelector('[data-sticker="badge"]')
  const onReach = (event: Event): void => {
    const link = event.target instanceof Element ? event.target.closest('a') : null
    const from = 'relatedTarget' in event ? event.relatedTarget : null
    if (link && !(from instanceof Node && link.contains(from))) {
      sound.tick()
    }
  }
  badge?.addEventListener('pointerover', onReach, { passive: true })
  badge?.addEventListener('focusin', onReach, { passive: true })
}

export function installSound(
  lid: HTMLElement,
  env: Env,
  win: Window = lid.ownerDocument.defaultView ?? window,
): Sound {
  const sound = createSound(env.createAudio)
  const button = lid.querySelector<HTMLElement>('[data-control="sound"]')
  sound.want(soundWanted(readPreference(env.storage), env.reducedMotion))
  tickOnBadge(lid, sound)
  if (!button) {
    return sound
  }
  if (sound.enabled()) {
    unlockOnGesture(win, sound)
  }

  button.addEventListener('click', () => {
    sound.enable(!sound.enabled())
    writePreference(env.storage, { on: sound.enabled(), reducedMotion: env.reducedMotion })
    button.setAttribute('aria-pressed', String(sound.enabled()))
    sound.tick()
  })
  button.setAttribute('aria-pressed', String(sound.enabled()))
  button.removeAttribute('hidden')
  return sound
}
