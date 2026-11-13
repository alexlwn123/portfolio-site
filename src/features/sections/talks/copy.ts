type Figure = number | string

/**
 * Voice, not facts: the words the "talks" section prints around the record.
 * Every title, date, place, count and address comes from the records. Stars,
 * arrows and dashes are drawn, not typed, so none appear here.
 */
export const talksCopy = Object.freeze({
  title: ['Talks', '& press'],
  kicker: 'on stage a lot. all over the map.',

  /** The print on the back of the tour shirt. */
  tour: {
    /** The headline, under his name and over the years. */
    title: ['World', 'tour'],
    /** Read out between the first year and the last. */
    to: 'to',
    /** What the list of dates is, for a reader who cannot see the shirt. */
    dates: 'Tour dates',
    /** The heading of a leg whose dates the record does not give. */
    undated: 'Date not recorded',
    /** The kinds of appearance, as the line under the headline names them. */
    formats: {
      discussion: 'discussions',
      workshop: 'workshops',
      panel: 'panels',
      talk: 'talks',
      podcast: 'podcasts',
    },
    /** Read out after a title that is a link, to say where it leads. */
    leadsTo: (label: string) => `(${label})`,
    /** Printed inside the collar, where the size goes. */
    size: 'one size fits all stages',
  },

  /** The "on air" sign for a show that is still running. */
  onAir: {
    sign: 'On air',
  },

  /** The bitcoin++ record, and the card that is stamped once for every edition. */
  record: {
    mark: '++',
    editions: (editions: Figure) => `${String(editions)} editions`,
    sessions: (sessions: Figure) => `${String(sessions)} stage sessions`,
    since: (year: Figure) => `member since ${String(year)}`,
    card: 'Stamp card',
    next: 'next',
  },

  /** The backstage pass for the workshop he keeps being asked to give. */
  pass: {
    band: 'Backstage',
    access: 'All access',
    note: 'a workshop I teach',
    given: (times: Figure) => `given ×${String(times)}`,
  },

  /** The press cuttings. What each may claim comes from the record, never from here. */
  press: {
    heading: 'Press',
    seeAlso: 'See also',
  },
} as const)
