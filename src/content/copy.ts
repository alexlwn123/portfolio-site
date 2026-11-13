import { deepFreeze } from '../lib/deepFreeze'

type Figure = number | string

/**
 * Voice, not facts: the slogans, labels and page furniture of the approved
 * mockups. Anything a reader could check (names, dates, counts, links) lives
 * in the record modules and in derive.ts, never here. Where a line carries a
 * figure it is a template, and the caller passes the figure in from `stats`.
 */
export const copy = deepFreeze({
  notFound: {
    title: 'Page not found',
    body: 'Nothing is stuck to this spot. The link may be old, or the address may have a typo.',
    homeLink: 'Back to the home page',
    cvLink: 'Read the plain CV',
  },

  /**
   * design/mockups/01-first-screen.html. Arrows and stars are drawn, not
   * typed, so none appear here: the mockup's glyphs fell back to system fonts.
   */
  lid: {
    /**
     * The hello tag: two short lines. His own first line opens it (see
     * introOpening in src/features/lid/facts.ts) and this follows, with the
     * employer passed in from the records.
     */
    hello: {
      greeting: 'HELLO',
      lead: 'I’m a',
      highlight: 'AI agents',
      now: (employer: string) => `I build AI agents at ${employer}.`,
    },
    /** The cover's cue to scroll, in his handwriting. Its arrow is drawn. */
    cue: { text: 'scroll for the highlights' },
    /** The cover's quieter line, under the hello tag: straight to the contact section. Its arrow is drawn. */
    contact: { text: 'contact me' },
    /** The pile under the cover: its heading sticker and the line under it. */
    pile: {
      title: ['At a', 'glance'],
      kicker: 'the short version. every sticker links to the full story.',
    },
    /** The asset tags his employers left on the lid. Names and years come from the records. */
    employers: {
      label: 'Where I have worked',
      propertyOf: 'Property of',
      issued: (year: Figure) => `Issued ${String(year)}`,
      inService: 'In service',
    },
    cvSticker: { kicker: 'Short on time?', label: 'Plain CV' },
    winsSeal: {
      top: 'HACKATHON',
      bottom: 'WINNER',
      times: (wins: Figure) => `${String(wins)}×`,
      summary: (wins: Figure) => `${String(wins)} hackathon wins`,
    },
    organizedSeal: {
      label: 'HACKATHONS ORGANIZED',
      countries: (countries: Figure) => `${String(countries)} COUNTRIES + ONLINE`,
      countriesInPerson: (countries: Figure) => `${String(countries)} COUNTRIES`,
      summary: (organized: Figure, countries: Figure) =>
        `${String(organized)} hackathons organized in ${String(countries)} countries plus online`,
      summaryInPerson: (organized: Figure, countries: Figure) =>
        `${String(organized)} hackathons organized in ${String(countries)} countries`,
    },
    lanyard: { loop: ['HACK', 'ORGANIZE', 'REPEAT'], city: 'ATL' },
    badge: {
      roles: ['Hacker', 'Organizer', 'Speaker'],
      photoAlt: (name: string) => `${name}, smiling, in a cap`,
    },
    ribbons: {
      engineer: 'ENGINEER',
      /** One ribbon for both hackathon sections. The next two are the pins stuck on it. */
      hackathons: 'HACKATHONS',
      organizer: 'ORGANIZER',
      winner: 'WINNER',
      speaker: 'SPEAKER',
      builder: 'BUILDER',
      inventor: 'INVENTOR',
      times: (count: Figure) => `×${String(count)}`,
    },
    /**
     * The compliance label's heading. The numbers under it come from the patent
     * records, and the noun is "filing": not every filing became a patent.
     */
    patentLabel: {
      one: 'U.S. PATENT FILING',
      many: 'U.S. PATENT FILINGS',
    },
    /** The medal for a win chosen from a field of teams. */
    medal: {
      outOf: (field: Figure) => `OF ${String(field)}`,
      teams: 'TEAMS',
      team: (name: string) => `Team ${name}`,
      summary: (rank: Figure, field: Figure, event: string, team: string) =>
        `${String(rank)} of ${String(field)} teams, ${event}, team ${team}`,
    },
    cities: { label: 'Cities I have run hackathons in' },
    bumper: { note: 'a workshop I teach at bitcoin++' },
    projects: { label: 'Projects' },
    button: { firstWeek: (sats: Figure) => `${String(sats)} SATS IN WEEK ONE` },
    parkingSign: { letter: 'P' },
    jukebox: { tagline: 'Lightning jukebox' },
    record: {
      mark: '++',
      name: 'bitcoin++',
      editions: (editions: Figure) => `${String(editions)} editions`,
      sessions: (sessions: Figure) => `${String(sessions)} stage sessions`,
    },
    hexWin: { series: 'BTC++' },
    phrase: 'BITCOIN & FREEDOM TECH',
    ghost: {
      saved: (nextNumber: Figure) => `this spot saved for hackathon #${String(nextNumber)}`,
      status: 'upcoming',
    },
    nav: { sections: 'Sections', elsewhere: 'Elsewhere', moreElsewhere: 'More elsewhere' },
    /** The note stuck under a project or a win. Its facts come from the records. */
    note: {
      peel: (name: string) => `Peel back ${name}`,
      result: (result: string, event: string, year: Figure) =>
        `${result} at ${event}, ${String(year)}.`,
      more: 'More in the CV',
    },
    /** The three stickers that are buttons. They appear once the page's script runs. */
    controls: {
      sound: 'Sound',
      tidy: ['Reset', 'stickers'],
      tilt: ['Tilt', 'me'],
    },
  },

  /**
   * design/mockups/02-wristbands.html. The star on the stamp and the arrow
   * after "room for more" are drawn, as on the lid, so neither is typed here.
   * The section's other words are in src/features/sections/organized/copy.ts.
   */
  wristbands: {
    title: ['HACKATHONS', 'ORGANIZED'],
    participants: 'participants',
    prizes: 'in prizes',
    participantsFootnote: (events: Figure) => `${String(events)} events with a public head count`,
    prizesFootnote: (events: Figure) => `${String(events)} events with a public prize figure`,
    stamp: {
      role: 'ORGANIZER',
      since: (sinceYear: Figure) => `SINCE ${String(sinceYear)}`,
    },
    blank: 'save the date',
    notAnnounced: 'not announced',
    nonMonetary: 'non-monetary prizes',
    coveredBy: (outlet: string) => `covered by ${outlet}`,
    roomForMore: 'room for more',
  },
})
