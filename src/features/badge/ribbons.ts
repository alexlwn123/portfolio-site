import type { Tone } from '../stickers/tones'

/*
 * What hangs under the badge. A ribbon says what he is and leads to the
 * section that shows it. One ribbon is for two sections at once, the
 * hackathons he has won and the ones he has organized: it is not a link
 * itself, and carries a pin-back button for each, which is.
 */

/** A ribbon that is one link. */
export interface LinkRibbon {
  readonly label: string
  readonly href: string
  readonly tone: Tone
}

/**
 * A pin-back button pinned to a ribbon: a link of its own, with a count on it
 * such as "×16". Its id names the definitions of its drawing.
 */
export interface Pin {
  readonly id: string
  readonly label: string
  readonly count: string
  readonly href: string
  readonly tone: Tone
}

/** A ribbon that is the heading for the pins stuck on it. */
export interface PinnedRibbon {
  readonly label: string
  readonly tone: Tone
  readonly pins: readonly Pin[]
}

export type Ribbon = LinkRibbon | PinnedRibbon

export function isPinned(ribbon: Ribbon): ribbon is PinnedRibbon {
  return 'pins' in ribbon
}

/** Every address a ribbon leads to: its own, or its pins', in the order they are stuck on. */
export function ribbonHrefs(ribbon: Ribbon): readonly string[] {
  return isPinned(ribbon) ? ribbon.pins.map(({ href }) => href) : [ribbon.href]
}
