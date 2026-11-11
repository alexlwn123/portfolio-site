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
    hello: { greeting: 'HELLO', lead: 'I’m a', highlight: 'hackathons' },
    cvSticker: { kicker: 'The serious version', label: 'Plain CV' },
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
      titleNote: 'real title',
      photoAlt: (name: string) => `${name}, smiling, in a cap`,
    },
    ribbons: {
      organizer: 'ORGANIZER',
      winner: 'WINNER',
      speaker: 'SPEAKER',
      builder: 'BUILDER',
      times: (count: Figure) => `×${String(count)}`,
    },
    cities: { label: 'Cities I have run hackathons in' },
    bumper: { note: 'a real workshop I teach at bitcoin++' },
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
  },

  /** design/mockups/02-wristbands.html */
  wristbands: {
    title: ['HACKATHONS', 'ORGANIZED'],
    subtitle: 'one wristband each. newest at the wrist.',
    back: 'BACK TO THE LID',
    participants: 'participants',
    prizes: 'in prizes',
    participantsFootnote: (events: Figure) => `${String(events)} events with a public head count`,
    prizesFootnote: (events: Figure) => `${String(events)} events with a public prize figure`,
    stamp: (sinceYear: Figure) => `ORGANIZER ✦ SINCE ${String(sinceYear)}`,
    blank: 'still on the roll',
    notAnnounced: 'not announced',
    figuresNotPublic: 'figures not public',
    paidInBitcoin: 'paid in bitcoin',
    nonMonetary: 'non-monetary',
    coveredBy: (outlet: string) => `covered by ${outlet}`,
    ownWin: 'I also won this one. Awkward. Haven’t entered my own since.',
    next: (wins: Figure) => `NEXT: ${String(wins)} WINS`,
    roomForMore: 'room for more ↓',
  },
})
