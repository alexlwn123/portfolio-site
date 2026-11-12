import { deepFreeze } from '../../../lib/deepFreeze'

/**
 * Voice, not facts: the words the "patents" section prints around the record.
 * Every number, title, date and name arrives from the content module.
 */
export const patentsCopy = {
  title: ['Patents', ''],

  /** The rating plate riveted to the underside. */
  plate: {
    heading: ['Inventor', 'rating plate'],
    holder: 'Named co-inventor',
    list: 'Patent filings',
    /** The one count. Its noun is "patent filing": not every filing became a patent. */
    count: {
      label: 'Named inventor on',
      one: 'U.S. patent filing',
      many: 'U.S. patent filings',
    },
    fields: {
      number: 'Publication no.',
      filed: 'Filed',
      assignee: 'Assignee',
      coInventors: { one: 'Co-inventor', many: 'Co-inventors' },
    },
    /** What follows a number in the name of its link: where it leads. */
    on: (source: string) => `on ${source}`,
    footnote: (source: string) => `Every number opens its public record on ${source}.`,
  },

  /** The made-up inspection stickers around the plate. */
  stickers: {
    list: 'Inspection stickers',
    quality: { stamp: 'QC', verdict: 'passed' },
    seal: { over: 'Named', word: 'Inventor' },
    caution: { head: 'Caution', lines: ['Novel.', 'Useful.', 'Non-obvious.'] },
  },
} as const

/* Frozen all the way down, so no component can rewrite the voice. */
deepFreeze(patentsCopy)
