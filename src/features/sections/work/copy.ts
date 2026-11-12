import { deepFreeze } from '../../../lib/deepFreeze'

type Figure = number | string

/** A word for one of something and a word for several. */
export interface Counted {
  readonly one: string
  readonly many: string
}

/**
 * Voice, not facts: the words the "work" section prints around the record.
 * Every name, date and count arrives from the content module.
 */
export const workCopy = {
  title: ['Career', 'path'],
  /** The line under the heading. The count and both employers come from the records. */
  kicker: (roles: Figure, first: string, latest: string) =>
    `${String(roles)} roles, from ${first} to ${latest}. newest first.`,

  /** The steel rule the tags hang off. */
  rule: {
    list: 'Career path, newest first',
    now: 'Now',
    unit: 'Years',
  },

  /** The asset tag a job leaves behind. */
  tag: {
    owner: 'Property of',
    asset: 'Asset no.',
    from: 'From',
    current: ['In', 'service'],
    currentNote: 'current role',
  },

  /** The parking permit from the university. */
  permit: {
    kind: 'Student permit',
    valid: 'Valid',
    from: 'From',
    subject: 'Zone',
    level: 'Class',
  },

  /** The small stickers on the other side of the rule. */
  marks: {
    also: (year: Figure) => `Also in ${String(year)}`,
    wins: { one: 'hackathon win', many: 'hackathon wins' },
    outOf: (field: Figure) => `of ${String(field)} teams`,
    organized: { one: 'hackathon organized', many: 'hackathons organized' },
    online: 'online',
    granted: { one: 'patent granted', many: 'patents granted' },
    filed: { one: 'patent application filed', many: 'patent applications filed' },
    filedOn: 'Filed',
    grantedIn: (year: Figure) => `granted ${String(year)}`,
    pending: 'pending',
    abandoned: 'abandoned',
    firstTalk: ['First talk', 'on record'],
  },

  /** The running count beside the current job. */
  totals: {
    label: 'So far',
    wins: { one: 'hackathon win', many: 'hackathon wins' },
    organized: { one: 'hackathon organized', many: 'hackathons organized' },
    stage: { one: 'bitcoin++ stage session', many: 'bitcoin++ stage sessions' },
    projects: { one: 'project', many: 'projects' },
    patents: { one: 'patent granted', many: 'patents granted' },
  },
} as const

/* Frozen all the way down, so no component can rewrite the voice. */
deepFreeze(workCopy)
