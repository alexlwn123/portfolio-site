import { deepFreeze } from '../../../lib/deepFreeze'

type Figure = number | string

/** "1 first", "6 firsts": the figure, then the word in the number it calls for. */
function counted(count: Figure, one: string, many: string): string {
  return `${String(count)} ${Number(count) === 1 ? one : many}`
}

/** The heading, over two lines. A pair, which is what the section's frame asks for. */
const TITLE: readonly [string, string] = Object.freeze(['Hackathon', 'wins'])

const words = deepFreeze({
  /** The strip printed across the top of the sheet. */
  sheet: {
    name: 'Prize stickers',
    edition: 'The complete set, newest first',
    make: 'Kiss-cut vinyl',
    pieces: (count: Figure) => counted(count, 'pc', 'pcs'),
    series: (from: Figure, to: Figure) =>
      String(from) === String(to) ? String(from) : `${String(from)}–${String(to)}`,
    finishes: 'Finishes',
    tallyLabel: 'The tally',
    listLabel: 'Hackathon wins, newest first',
  },

  /** How many of each result, and so of each finish. */
  tally: {
    first: (count: Figure) => counted(count, 'first', 'firsts'),
    second: (count: Figure) => counted(count, 'second', 'seconds'),
    third: (count: Figure) => counted(count, 'third', 'thirds'),
    prize: (count: Figure) => counted(count, 'prize', 'prizes'),
  },

  /** What a sticker says where a place would be, for a win that was not a place. */
  rank: { prize: 'Prize' },

  sticker: {
    field: (figure: string) => `of ${figure} teams`,
  },

  /** In his handwriting, on the sheet. */
  hand: {
    peeled: 'peeled this one off. it’s on the lid, up top.',
    ownHackathon: 'yes, I ran this one too. Awkward.',
    trackPrize: 'a prize for the track, not a place on the podium.',
  },

  /** A link's name: its label, then what it belongs to, so "Code" is never ambiguous. */
  linkName: (label: string, subject: string) => `${label}: ${subject}`,
})

/**
 * Voice, not facts: the words the "wins" section prints around the record.
 * The section is a sheet of kiss-cut prize stickers, so its words are the
 * ones a sticker shop prints on a sheet, and the ones he wrote on it since.
 */
export const winsCopy = Object.freeze({ ...words, title: TITLE })
