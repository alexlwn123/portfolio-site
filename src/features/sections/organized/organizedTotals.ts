import type { Stats } from '../../../content'
import { formatNumber, formatUsd } from '../../../lib/formatNumber'
import { organizedCopy } from './copy'

/*
 * The totals over the arm, as they are printed. Every figure is one that
 * derive.ts added up. The two sums are over different sets of events, so
 * each one carries a footnote of its own that says which.
 */

/** A sum, the word after it, and the events it is a sum of. */
export interface TotalTile {
  readonly figure: string
  readonly label: string
  readonly footnote: string
}

export interface OrganizedTotals {
  /** The big number, and what it counts in words. */
  readonly count: { readonly figure: string; readonly summary: string }
  readonly countries: { readonly label: string; readonly names: readonly string[] }
  readonly participants: TotalTile
  readonly prizes: TotalTile
  /** The stamp on the hand. No year until the first hackathon has been held. */
  readonly stamp: { readonly role: string; readonly since: string | null }
}

export function organizedTotals(organized: Stats['organized']): OrganizedTotals {
  return {
    count: {
      figure: formatNumber(organized.count),
      summary: organizedCopy.count(formatNumber(organized.count)),
    },
    countries: {
      label: organizedCopy.countries(organized.countryCount, organized.includesOnline),
      names: organized.countries,
    },
    participants: {
      figure: formatNumber(organized.participants),
      label: organizedCopy.participants,
      footnote: organizedCopy.participantsFootnote(organized.headCountEvents),
    },
    prizes: {
      figure: formatUsd(organized.prizeUsd),
      label: organizedCopy.prizes,
      footnote: organizedCopy.prizesFootnote(organized.prizeEvents),
    },
    stamp: {
      role: organizedCopy.stamp.role,
      since: organized.sinceYear === null ? null : organizedCopy.stamp.since(organized.sinceYear),
    },
  }
}
