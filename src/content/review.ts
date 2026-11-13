import type { Source } from './schema'

/** One record that web research added or corrected, for him to check. */
export interface ReviewItem {
  /** Where the record lives: "wins.bitdevs-upgrade". */
  readonly record: string
  /** What the research changed. */
  readonly note: string
  /** The pages it was found on. */
  readonly urls: readonly string[]
}

interface Sourced {
  readonly id: string
  readonly source: Source
}

/** The parts of the content whose records say where they come from. */
export interface Reviewable {
  readonly profile: { readonly links: readonly Sourced[] }
  readonly education: readonly Sourced[]
  readonly wins: readonly Sourced[]
  readonly organized: readonly Sourced[]
  readonly talks: readonly Sourced[]
}

function unconfirmed(list: string, records: readonly Sourced[]): readonly ReviewItem[] {
  return records.flatMap(({ id, source }) =>
    source.kind === 'publicRecord'
      ? [{ record: `${list}.${id}`, note: source.note, urls: source.urls }]
      : [],
  )
}

/**
 * Every record marked `publicRecord`, as one list: what came from web
 * research and still waits for his confirmation. Nothing on the site reads
 * this. It exists so that he can review those records as a group.
 */
export function publicRecordItems(content: Reviewable): readonly ReviewItem[] {
  return [
    ...unconfirmed('profile.links', content.profile.links),
    ...unconfirmed('education', content.education),
    ...unconfirmed('wins', content.wins),
    ...unconfirmed('organized', content.organized),
    ...unconfirmed('talks', content.talks),
  ]
}
