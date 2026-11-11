import { deepFreeze } from '../../../lib/deepFreeze'

/**
 * Voice, not facts: the words the "contact" section prints around the record.
 * His name, his city, the address and every link arrive from the content module.
 */
export const contactCopy = {
  title: ['Say', 'hello'],
  kicker: 'that’s the whole lid. the rest is a conversation.',

  /** The label on the underside that gets a lost laptop home. */
  label: {
    plea: ['If found,', 'please return to'],
    email: 'Write to',
    reward: 'Reward: one sticker, hardly used.',
  },

  /** The strips of wristband, one to a link. */
  bands: { list: 'Elsewhere' },

  /** The asset tag that leads to the plain CV. */
  cv: { kicker: 'No stickers, all facts', label: 'Plain CV' },

  smallPrint: 'No stickers were harmed in the making of this lid. A few were repositioned.',
} as const

/* Frozen all the way down, so no component can rewrite the voice. */
deepFreeze(contactCopy)
