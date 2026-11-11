import { deepFreeze } from '../../../lib/deepFreeze'

/**
 * Voice, not facts: the words the "patents" section prints around the record.
 * Every number, title, date and name arrives from the content module.
 */
export const patentsCopy = {
  title: ['Patents', ''],
  kicker: 'flip the laptop over. it’s all on the rating plate.',

  /** The rating plate riveted to the underside. */
  plate: {
    heading: ['Inventor', 'rating plate'],
    holder: 'Named co-inventor',
    list: 'Patent filings',
    counts: {
      granted: { one: 'Patent granted', many: 'Patents granted' },
      pending: { one: 'Application pending', many: 'Applications pending' },
    },
    fields: {
      patentNumber: 'Patent no.',
      applicationNumber: 'Application no.',
      status: 'Status',
      filed: 'Filed',
      assignee: 'Assignee',
      coInventors: { one: 'Co-inventor', many: 'Co-inventors' },
    },
    status: {
      granted: 'Granted',
      pending: 'Application pending',
      abandoned: 'Application abandoned',
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
