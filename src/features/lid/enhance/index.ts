import { installDrag } from './dragDom'
import type { Env } from './env'
import { installLight } from './lightDom'
import { installPeel } from './peelDom'
import { installReset } from './resetControl'
import { installSound } from './soundDom'
import { createTicker } from './ticker'
import { installTilt } from './tiltDom'

/*
 * Everything the lid can do once its script has loaded: one light that
 * follows the pointer or a tilted phone, stickers that can be picked up,
 * thrown and peeled back, three quiet sounds, and a button that puts it all
 * back. Without the script the lid is the static page it always was.
 */

/**
 * Enhances the lid on a page, if the page has one. The lid is marked as
 * enhanced only once everything is in place, so a failure part of the way
 * leaves the stylesheet treating it as the static lid.
 */
export function enhanceLid(doc: Document, env: Env): boolean {
  const lid = doc.querySelector<HTMLElement>('[data-lid]')
  if (!lid) {
    return false
  }
  const ticker = createTicker(env.frames)
  const sound = installSound(lid, env)
  const light = installLight(lid, env, ticker)
  installTilt(lid, env, light)
  const peel = installPeel(lid, env, ticker, { onPeel: sound.crackle })
  const drag = installDrag(lid, env, ticker, { onLift: peel.close, onDrop: sound.slap })
  installReset(lid, [drag.tidy, peel.close])
  lid.setAttribute('data-enhanced', '')
  return true
}
