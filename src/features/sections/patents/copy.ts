import { deepFreeze } from '../../../lib/deepFreeze'

/**
 * Voice, not facts: the words the "patents" section prints around the record.
 * Every number, title, date and name arrives from the content module.
 */
export const patentsCopy = {
  title: ['Patents', ''],

  /** The plate riveted to the underside: his patent records. */
  plate: {
    heading: ['Patent', 'records'],
    holder: 'Named co-inventor',
    list: 'Patent filings',
    /** The one count. Its noun is "patent filing": not every filing became a patent. */
    count: {
      label: 'Named inventor on',
      one: 'U.S. patent filing',
      many: 'U.S. patent filings',
    },
    /** What a row prints of a filing: its number, and the day it was filed. */
    fields: { number: 'Publication no.', filed: 'Filed' },
    /** What follows a number in the name of its link: where it leads. */
    on: (source: string) => `on ${source}`,
    footnote: (source: string) => `Every number opens its public record on ${source}.`,
  },

  /** The two stickers on the plate: a die-cut emoji, and a made-up quality check. */
  stickers: {
    list: 'Stickers',
    /** The emoji, and the name it is read out by: the bulb that stands for an idea. */
    emoji: { glyph: '💡', name: 'Light bulb' },
    quality: { stamp: 'QC', verdict: 'passed' },
  },
} as const

/* Frozen all the way down, so no component can rewrite the voice. */
deepFreeze(patentsCopy)
