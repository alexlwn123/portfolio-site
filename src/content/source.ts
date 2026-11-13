import type { z } from 'zod'

import type { sourceSchema } from './schema'

type SourceInput = z.input<typeof sourceSchema>

/** He stated it. The addresses are public pages that back it up, when there are any. */
export function fromOwner(...urls: readonly string[]): SourceInput {
  return { kind: 'owner', urls: [...urls] }
}

/**
 * Web research added or corrected it, and he has not confirmed it yet. The
 * note says what the research changed; the addresses are where it was found.
 */
export function fromPublicRecord(note: string, ...urls: readonly string[]): SourceInput {
  return { kind: 'publicRecord', note, urls: [...urls] }
}
