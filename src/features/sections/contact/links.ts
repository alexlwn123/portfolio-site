import type { Profile } from '../../../content'
import type { Tone } from '../../stickers/tones'

type ProfileLink = Profile['links'][number]

/** One strip of wristband: the link it carries and the colour it is cut from. */
export interface ContactBand {
  readonly id: ProfileLink['id']
  readonly label: string
  readonly href: string
  readonly tone: Tone
}

/** The colours the strips take in turn. All of them are pale enough to print in ink. */
export const BAND_TONES: readonly Tone[] = Object.freeze(['gum', 'hi', 'mint', 'tang', 'white'])

const FIRST_TONE: Tone = 'gum'

/**
 * The ways to reach him that the section offers, in the order the owner put
 * them. The record holds other links too (his Devpost, his bitcoin++ profile,
 * his business-card page): those are things to read, not ways to reach him.
 */
export const CONTACT_LINK_IDS: readonly ProfileLink['id'][] = Object.freeze([
  'x',
  'github',
  'booking',
  'linkedin',
])

/**
 * A strip for each way to reach him, in the owner's order, lettered with the
 * short label where the record has one. A link the record no longer holds
 * simply has no strip.
 */
export function contactBands(links: Profile['links']): readonly ContactBand[] {
  return CONTACT_LINK_IDS.flatMap((id) => links.filter((link) => link.id === id)).map(
    ({ id, label, shortLabel, url }, index) => ({
      id,
      label: shortLabel ?? label,
      href: url,
      tone: BAND_TONES[index % BAND_TONES.length] ?? FIRST_TONE,
    }),
  )
}

/** An address as the link that writes to it. */
export function mailto(email: string): string {
  return `mailto:${email}`
}

/** "Atlanta, GA": the city and its state, as an envelope has them. */
export function cityLine({ city, regionCode }: Profile['location']): string {
  return `${city}, ${regionCode}`
}
