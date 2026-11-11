import type { Profile } from '../../../content'
import type { Tone } from '../../stickers/tones'

/** One strip of wristband: the link it carries and the colour it is cut from. */
export interface ContactBand {
  readonly id: Profile['links'][number]['id']
  readonly label: string
  readonly href: string
  readonly tone: Tone
}

/** The colours the strips take in turn. All of them are pale enough to print in ink. */
export const BAND_TONES: readonly Tone[] = Object.freeze(['gum', 'hi', 'mint', 'tang', 'white'])

const FIRST_TONE: Tone = 'gum'

/**
 * A strip for every link in the profile, in the profile's order, lettered
 * with the short label where the record has one.
 */
export function contactBands(links: Profile['links']): readonly ContactBand[] {
  return links.map(({ id, label, shortLabel, url }, index) => ({
    id,
    label: shortLabel ?? label,
    href: url,
    tone: BAND_TONES[index % BAND_TONES.length] ?? FIRST_TONE,
  }))
}

/** An address as the link that writes to it. */
export function mailto(email: string): string {
  return `mailto:${email}`
}

/** "Atlanta, GA": the city and its state, as an envelope has them. */
export function cityLine({ city, regionCode }: Profile['location']): string {
  return `${city}, ${regionCode}`
}
