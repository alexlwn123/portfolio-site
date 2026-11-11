import type { Content, Profile } from '../../content'

/** A schema.org Person, limited to what the record states. */
export interface PersonJsonLd {
  readonly '@context': 'https://schema.org'
  readonly '@type': 'Person'
  readonly name: string
  readonly givenName: string
  readonly familyName: string
  readonly url: string
  readonly image: string
  readonly jobTitle: string
  readonly worksFor: { readonly '@type': 'Organization'; readonly name: string }
  readonly address: {
    readonly '@type': 'PostalAddress'
    readonly addressLocality: string
    readonly addressRegion: string
    readonly addressCountry: string
  }
  readonly email: string
  readonly sameAs: readonly string[]
}

type LinkId = Profile['links'][number]['id']

/** Profiles that are him elsewhere. Booking and business-card pages are not. */
const SAME_AS: readonly LinkId[] = Object.freeze([
  'github',
  'x',
  'linkedin',
  'devpost',
  'bitcoinPlusPlus',
])

export function buildPersonJsonLd(content: Pick<Content, 'profile'>, image: string): PersonJsonLd {
  const { profile } = content
  const sameAs = SAME_AS.flatMap((id) =>
    profile.links.filter((link) => link.id === id).map((link) => link.url),
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    givenName: profile.givenName,
    familyName: profile.familyName,
    url: profile.site,
    image,
    jobTitle: profile.role.title,
    worksFor: { '@type': 'Organization', name: profile.role.organization },
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location.city,
      addressRegion: profile.location.region,
      addressCountry: profile.location.country,
    },
    email: profile.email,
    sameAs,
  }
}

const UNSAFE_IN_SCRIPT = /[<>&\u2028\u2029]/g
const HEX = 16
const CODE_UNIT_WIDTH = 4

function escapeForScript(character: string): string {
  const codeUnit = character.charCodeAt(0).toString(HEX).padStart(CODE_UNIT_WIDTH, '0')
  return `\\u${codeUnit}`
}

/**
 * Serializes data for a `<script type="application/ld+json">` element. The
 * characters that could close the element or start markup are written as
 * \uXXXX escapes, which JSON parses back to the same text.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(UNSAFE_IN_SCRIPT, escapeForScript)
}
