/*
 * The lanyard as it hangs still: two straps from far above the lid down to
 * the clip, drawn on the 260-unit square the badge shares with them. The
 * mockup drew them from (-96, -300) and (356, -300) to the clip at (124, 268)
 * and (136, 268), and lettered them with a star after every word.
 */

interface At {
  readonly x: number
  readonly y: number
}

export interface StrapLine {
  /** Where the lettering starts. */
  readonly from: At
  /** Where it runs to. */
  readonly to: At
  /** Which end is fixed above the lid: the other is at the clip. */
  readonly fixed: 'from' | 'to'
}

export const LANYARD_VIEW = Object.freeze({ width: 260, height: 300 })

export const STRAP_LINES: Readonly<Record<'left' | 'right', StrapLine>> = Object.freeze({
  /** Lettered down to the clip. */
  left: Object.freeze({
    from: Object.freeze({ x: -96, y: -300 }),
    to: Object.freeze({ x: 124, y: 268 }),
    fixed: 'from',
  }),
  /** Lettered up from the clip. */
  right: Object.freeze({
    from: Object.freeze({ x: 136, y: 268 }),
    to: Object.freeze({ x: 356, y: -300 }),
    fixed: 'to',
  }),
})

/** The lettering: its size in units, its tracking in em, and how far its baseline sits below the middle of the strap. */
export const STRAP_LETTERING = Object.freeze({ size: 13.5, tracking: 0.16, baseline: 4.75 })

/** The star after each word, in em of the lettering: its size and the room either side of it. */
export const STRAP_STAR = Object.freeze({ size: 0.79, before: 0.33, after: 0.49 })

/** The star is drawn on a square this many units wide (see STAR_PATH). */
export const STAR_DRAWN_ON = 12
