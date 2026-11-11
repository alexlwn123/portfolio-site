/*
 * Words the CV page prints around the record: headings, flags and joining
 * phrases. No names, dates or numbers. Those come from the content module.
 */

export const SECTIONS = Object.freeze([
  { id: 'experience', title: 'Experience' },
  { id: 'wins', title: 'Hackathon wins' },
  { id: 'organized', title: 'Hackathons organized' },
  { id: 'talks', title: 'Talks, workshops and panels' },
  { id: 'projects', title: 'Projects' },
  { id: 'press', title: 'Press' },
  { id: 'education', title: 'Education' },
  { id: 'contact', title: 'Contact' },
] as const)

export type SectionId = (typeof SECTIONS)[number]['id']

export function sectionTitle(id: SectionId): string {
  const section = SECTIONS.find((candidate) => candidate.id === id)
  if (!section) {
    throw new Error(`Unknown CV section "${id}"`)
  }
  return section.title
}

export const MAIN_ID = 'content'
export const WINS_ANCHOR = '#wins'

export const LABELS = Object.freeze({
  skip: 'Skip to the CV',
  home: 'Back to the home page',
  sectionsNav: 'Sections',

  current: 'Current',
  from: 'From',
  currentFrom: 'Current, from',
  began: 'Began',
  graduated: 'Graduated',

  prizeWinner: 'Prize winner',
  overall: 'overall',
  tied: 'tied',

  online: 'Online',
  heldList: 'Hackathons held',
  upcoming: 'Upcoming',
  upcomingNote: 'Not yet held, so not counted in the totals above.',
  nonMonetaryPrizes: 'Non-monetary prizes',
  bitcoinPrizes: 'Prizes paid in bitcoin',

  talksList: 'Talks',
  ongoing: 'Ongoing',
  alsoListedAs: 'Also listed as',
  bitcoinPlusPlus: 'bitcoin++',
  editionsList: 'bitcoin++ editions attended',

  hackathonWin: 'Hackathon win',
  reportedBy: 'Reported by',
  email: 'Email',
  site: 'Site',
} as const)

export const TALK_FORMATS = Object.freeze({
  discussion: 'Discussion',
  workshop: 'Workshop',
  panel: 'Panel',
  talk: 'Talk',
  podcast: 'Podcast',
} as const)
