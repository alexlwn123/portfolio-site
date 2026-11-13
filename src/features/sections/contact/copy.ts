import { deepFreeze } from '../../../lib/deepFreeze'

/**
 * Voice, not facts: the words the "contact" section prints around the record.
 * His name, his city, the address and every link arrive from the content module.
 */
export const contactCopy = {
  title: ['Say', 'hello'],
  kicker: 'got something worth building? let’s talk.',

  /** The address label: the hint beside the work address. */
  label: { email: 'Write to' },

  /** The strips of wristband, one to a way of reaching him. */
  bands: { list: 'Elsewhere' },

  /** The asset tag that leads to the plain CV. */
  cv: { kicker: 'No stickers, all facts', label: 'Plain CV' },

  smallPrint: 'Thanks for scrolling this far.',
} as const

/* Frozen all the way down, so no component can rewrite the voice. */
deepFreeze(contactCopy)
