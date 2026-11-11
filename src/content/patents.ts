import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { patentSchema } from './schema'

type PatentInput = z.input<typeof patentSchema>
type DateInput = NonNullable<PatentInput['filed']>

const on = (year: number, month: number, day: number): DateInput => ({ year, month, day })

/** The public record of a filing, by its publication number. */
const googlePatents = (publication: string): PatentInput['link'] => ({
  label: 'Google Patents',
  url: `https://patents.google.com/patent/${publication}/en`,
})

/*
 * The four US filings that name him as a co-inventor, each checked against
 * its Google Patents page. Two are granted patents and two are applications:
 * never "four patents". Granted first, newest grant first, then the
 * applications. The abandoned application is kept for the record and is not
 * shown on the site: set `shown` to true to list it.
 */
const records: readonly PatentInput[] = [
  {
    id: 'us-12536579',
    number: { office: 'US', serial: '12,536,579', kindCode: 'B2' },
    title: 'Methods and a system for in-store navigation',
    filed: on(2021, 7, 2),
    status: { kind: 'granted', granted: on(2026, 1, 27) },
    assignee: 'NCR Voyix Corp',
    coInventors: ['Christian Lee McDaniel'],
    link: googlePatents('US12536579B2'),
    shown: true,
  },
  {
    id: 'us-12354083',
    number: { office: 'US', serial: '12,354,083', kindCode: 'B2' },
    title: 'Self-sovereign identity structured messaging for cross channel authentication',
    filed: on(2022, 4, 29),
    status: { kind: 'granted', granted: on(2025, 7, 8) },
    assignee: 'Digital First Holdings LLC',
    coInventors: ['Bryan Walser Nonni'],
    link: googlePatents('US12354083B2'),
    shown: true,
  },
  {
    id: 'us-20230032782',
    number: { office: 'US', serial: '2023/0032782', kindCode: 'A1' },
    title: 'Self-Sovereign Identity Verifiable Credentials for Consent Processing',
    filed: on(2022, 10, 14),
    status: { kind: 'pending' },
    assignee: 'NCR Corp',
    coInventors: ['Bryan Walser Nonni'],
    link: googlePatents('US20230032782A1'),
    shown: true,
  },
  {
    id: 'us-20240037539',
    number: { office: 'US', serial: '2024/0037539', kindCode: 'A1' },
    title: 'Methods and a system for managing and integrating non-fungible tokens (NFTs)',
    filed: on(2022, 7, 29),
    status: { kind: 'abandoned' },
    assignee: 'NCR Voyix Corp',
    coInventors: ['Bryan Walser Nonni', 'Brent Vance Zucker'],
    link: googlePatents('US20240037539A1'),
    // Abandoned: in the data, off the site.
    shown: false,
  },
]

export const patents = parseContent(recordList(patentSchema), records, 'patents')
