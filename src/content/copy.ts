import { deepFreeze } from '../lib/deepFreeze'

type Figure = number | string

/**
 * Voice, not facts: the slogans, labels and page furniture of the approved
 * mockups. Anything a reader could check (names, dates, counts, links) lives
 * in the record modules and in derive.ts, never here. Where a line carries a
 * figure it is a template, and the caller passes the figure in from `stats`.
 */
export const copy = deepFreeze({
  placeholder: {
    title: 'The lid is coming',
    body: 'This page will be the lid of a laptop, covered in stickers. Until they are stuck down, the plain CV has the whole record.',
    cvLink: 'Read the plain CV',
  },

  notFound: {
    title: 'Page not found',
    body: 'Nothing is stuck to this spot. The link may be old, or the address may have a typo.',
    homeLink: 'Back to the home page',
    cvLink: 'Read the plain CV',
  },

  /** design/mockups/01-first-screen.html */
  lid: {
    hello: { greeting: 'HELLO', lead: 'I’m a' },
    cvSticker: { kicker: 'The serious version', label: 'Plain CV' },
    winsSeal: {
      top: 'HACKATHON',
      bottom: 'WINNER',
      times: (wins: Figure) => `${String(wins)}×`,
    },
    organizedSeal: {
      label: 'HACKATHONS ORGANIZED',
      countries: (countries: Figure) => `${String(countries)} COUNTRIES + ONLINE`,
    },
    lanyard: { loop: ['HACK', 'ORGANIZE', 'REPEAT'], city: 'ATL', separator: '✦' },
    badge: { roles: ['Hacker', 'Organizer', 'Speaker'], titleNote: 'real title ↓' },
    ribbons: {
      organizer: 'ORGANIZER',
      winner: 'WINNER',
      speaker: 'SPEAKER',
      builder: 'BUILDER',
      times: (count: Figure) => `×${String(count)}`,
    },
    bumper: { note: 'a real workshop I teach at bitcoin++' },
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
    footnote: (events: Figure) => `${String(events)} events with public figures`,
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
