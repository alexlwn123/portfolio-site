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
 * The four US filings that name him as an inventor, each checked against its
 * Google Patents page. All four are shown, listed together in this order as
 * filings he is named on. What became of each is kept here, in `status`, so
 * that the record stays true; the site neither prints it nor counts by it,
 * and where it counts them it says "patent filings". Who each is assigned to
 * and who else it names are not kept: the owner took both off the site, and
 * the public record each links to has them.
 */
const records: readonly PatentInput[] = [
  {
    id: 'us-12536579',
    number: { office: 'US', serial: '12,536,579', kindCode: 'B2' },
    title: 'Methods and a system for in-store navigation',
    filed: on(2021, 7, 2),
    status: { kind: 'granted', granted: on(2026, 1, 27) },
    link: googlePatents('US12536579B2'),
    shown: true,
  },
  {
    id: 'us-12354083',
    number: { office: 'US', serial: '12,354,083', kindCode: 'B2' },
    title: 'Self-sovereign identity structured messaging for cross channel authentication',
    filed: on(2022, 4, 29),
    status: { kind: 'granted', granted: on(2025, 7, 8) },
    link: googlePatents('US12354083B2'),
    shown: true,
  },
  {
    id: 'us-20230032782',
    number: { office: 'US', serial: '2023/0032782', kindCode: 'A1' },
    title: 'Self-Sovereign Identity Verifiable Credentials for Consent Processing',
    filed: on(2022, 10, 14),
    status: { kind: 'pending' },
    link: googlePatents('US20230032782A1'),
    shown: true,
  },
  {
    id: 'us-20240037539',
    number: { office: 'US', serial: '2024/0037539', kindCode: 'A1' },
    title: 'Methods and a system for managing and integrating non-fungible tokens (NFTs)',
    filed: on(2022, 7, 29),
    status: { kind: 'abandoned' },
    link: googlePatents('US20240037539A1'),
    shown: true,
  },
]

export const patents = parseContent(recordList(patentSchema), records, 'patents')
