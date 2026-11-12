type Figure = number | string

/**
 * Voice, not facts: the words the "projects" section prints around the record.
 * Every name, description, result and address comes from the records. Arrows
 * are drawn, not typed, so none appear here.
 */
export const projectsCopy = Object.freeze({
  title: ['Things', 'I built'],
  kicker: 'serious tech, shipped as toys.',
  /** What the list of stickers is, for a reader who cannot see the mat. */
  list: 'Projects',
  /** Written beside the sticker of the project that is also his job. */
  dayJob: 'my day job',
  /** What a project's row of links is, read out before them. */
  links: (name: string) => `Links for ${name}`,
  /** Read out before a win flag, so that it says whose win it is. */
  flagOwner: (name: string) => `${name}:`,
  /** The lettering round the foot of the arcade button. */
  firstWeek: (sats: Figure) => `${String(sats)} SATS IN WEEK ONE`,
  /** The letter on the parking sign. */
  parkingLetter: 'P',
  /** How the hex badge writes the name of the conference series. */
  series: 'BTC++',
  /** The scribbles on the mat itself. */
  mat: {
    knife: 'cut here',
    offcuts: 'offcuts',
  },
} as const)
