import { copy } from '../../../content/copy'
import { deepFreeze } from '../../../lib/deepFreeze'

type Figure = number | string

/** "1 team", "10 teams": the figure, then the word in the number it calls for. */
function counted(count: Figure, one: string, many: string): string {
  return `${String(count)} ${Number(count) === 1 ? one : many}`
}

/** The mockup's heading, as the pair of lines the section's frame asks for. */
const [firstLine = '', secondLine = ''] = copy.wristbands.title
const TITLE: readonly [string, string] = Object.freeze([firstLine, secondLine])

const words = deepFreeze({
  ...copy.wristbands,

  /** The big number, in words. */
  count: (held: Figure) => `${counted(held, 'hackathon', 'hackathons')} organized`,
  countries: (count: Figure, online: boolean) =>
    `${counted(count, 'country', 'countries')}${online ? ' + online' : ''}`,
  countriesList: 'Countries',
  totalsLabel: 'The totals',

  online: 'Online',
  upcoming: 'upcoming',

  /* What a band's label can carry. A figure arrives formatted. */
  people: (count: Figure) => counted(count, 'participant', 'participants'),
  aboutPeople: (count: Figure) => `about ${counted(count, 'participant', 'participants')}`,
  teams: (count: Figure) => counted(count, 'team', 'teams'),
  projects: (count: Figure) => counted(count, 'project', 'projects'),
  usdPrizes: (amount: string) => `${amount} prizes`,
  satsPrizes: (millions: string) => `${millions}M sats in prizes`,

  /** The press link's name: what it is, then what the piece covered. */
  linkName: (label: string, subject: string) => `${label}: ${subject}`,

  listLabel: 'Hackathons organized, newest first',
  bandNumber: (number: Figure) => `Number ${String(number)}:`,
  hand: (stamp: string) => `A hand held up for a high five. The stamp on it reads: ${stamp}.`,
})

/**
 * Voice, not facts: the words the "organized" section prints around the
 * record. The words of the approved mockup are copy.wristbands, carried here
 * unchanged. What follows them is what the section says that the mockup did
 * not: the figures it had no wording for, and the names read out to someone
 * who cannot see the arm.
 */
export const organizedCopy = Object.freeze({ ...words, title: TITLE })
