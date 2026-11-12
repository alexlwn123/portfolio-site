import { createStore } from '../lid/enhance/store'

/*
 * A strap link the keyboard reaches is brought wholly into view. On a narrow
 * screen the links scroll sideways inside the strap, and a browser scrolls a
 * focused link into view only when it is entirely out of sight: one that is
 * half cut off by the edge of the list is left there. This moves it the rest
 * of the way.
 *
 * Only for the keyboard. A link the pointer has pressed stays exactly where
 * it is, or it would slide out from under the click.
 */

const STRAP = '[data-pinned-strap]'

/** Watches the page's strap, if it has one. False when there is none. */
export function keepStrapLinksInView(doc: Document): boolean {
  const strap = doc.querySelector<HTMLElement>(STRAP)
  if (!strap) {
    return false
  }
  const byKeyboard = createStore(false)

  doc.addEventListener(
    'keydown',
    () => {
      byKeyboard.set(true)
    },
    { capture: true, passive: true },
  )
  doc.addEventListener(
    'pointerdown',
    () => {
      byKeyboard.set(false)
    },
    { capture: true, passive: true },
  )
  strap.addEventListener('focusin', ({ target }) => {
    if (byKeyboard.get() && target instanceof Element && 'scrollIntoView' in target) {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  })
  return true
}
