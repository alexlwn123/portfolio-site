import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { bitcoinPlusPlusSchema, talkSchema } from './schema'

type TalkInput = z.input<typeof talkSchema>

const on = (year: number, month: number | null = null, day: number | null = null) =>
  ({ kind: 'date', date: { year, month, day } }) as const

const confirmed = (name: string) => ({ name, confirmed: true }) as const

/* Talks, workshops and panels, in the order of the CV file. */
const talkRecords: readonly TalkInput[] = [
  {
    id: 'teaching-ai-as-a-tool-for-freedom',
    when: on(2026, 8),
    title: 'Teaching AI As a Tool for Freedom',
    format: 'discussion',
    detail: 'With the Human Rights Foundation',
    alsoListedAs: null,
    venue: confirmed('PubKey, New York City'),
    links: [{ label: 'Broadcast on X', url: 'https://x.com/i/broadcasts/1nKOLLlZEprGR' }],
  },
  {
    id: 'sovereign-banks-fedi',
    when: on(2025, 12, 15),
    title: 'Building Sovereign Banks with Fedi',
    format: 'workshop',
    detail: null,
    alsoListedAs: null,
    venue: confirmed('bitcoin++ Taipei'),
    links: [],
  },
  {
    id: 'scaling-lightning',
    when: on(2025, 10, 3),
    title: 'Scaling Lightning',
    format: 'panel',
    detail: 'With Calle, Evan Kaloudis, Shinobi and Walton',
    alsoListedAs: null,
    venue: confirmed('Lightning++ Berlin'),
    links: [{ label: 'Video on YouTube', url: 'https://www.youtube.com/watch?v=oFDaC_2WjP0' }],
  },
  {
    id: 'how-to-win-every-hackathon',
    when: on(2025, 2, 20),
    title: 'How to Win Every Hackathon',
    format: 'workshop',
    detail: null,
    alsoListedAs: null,
    venue: confirmed('bitcoin++ Florianópolis'),
    links: [{ label: 'Video on YouTube', url: 'https://www.youtube.com/watch?v=X9yLrPk_LnE' }],
  },
  {
    id: 'fedimint-sdk-workshop',
    when: on(2024),
    title: 'Fedimint SDK workshop',
    format: 'workshop',
    detail: null,
    alsoListedAs: null,
    venue: confirmed('Btrust Developer Day, Africa Bitcoin Conference 2024'),
    links: [{ label: 'Post on X', url: 'https://x.com/ALewin/status/1861778110120591373' }],
  },
  {
    id: 'fedimint-wallet-in-20-minutes',
    when: on(2024, 10, 11),
    title: 'How to build a Fedimint wallet in 20 minutes (without Rust)',
    format: null,
    detail: null,
    alsoListedAs: 'Fedimint SDK Deep Dive',
    venue: confirmed('bitcoin++ Berlin'),
    links: [{ label: 'Video on YouTube', url: 'https://youtu.be/KCZ6y2ufavw' }],
  },
  {
    id: 'fun-with-lightning',
    when: on(2024, 2, 23),
    title: 'Fun with Lightning: How to Win Every Bitcoin Hackathon',
    format: 'workshop',
    detail: null,
    alsoListedAs: null,
    venue: confirmed('bitcoin++ Buenos Aires'),
    links: [],
  },
  {
    id: 'sovereign-banks-fedimint',
    // Neither the date nor the venue is confirmed. The venue comes from the linked article.
    when: null,
    title: 'Building Sovereign Banks with Fedimint',
    format: 'talk',
    detail: '“Recreating sovereign community banks with chaumian ecash mints + bitcoin”',
    alsoListedAs: null,
    venue: { name: 'Bitcoin Park', confirmed: false },
    links: [
      { label: 'Video on YouTube', url: 'https://youtu.be/-anhf5szB2I' },
      { label: 'Article', url: 'https://bitcoinpark.substack.com/p/thursday-feb05' },
    ],
  },
  {
    id: 'bitdevs-radio-hour',
    // His role on the show is not stated anywhere, so none is recorded.
    when: { kind: 'ongoing' },
    title: 'BitDevs Radio Hour',
    format: 'podcast',
    detail: 'A weekly podcast on technical bitcoin news',
    alsoListedAs: null,
    venue: null,
    links: [
      {
        label: 'Playlist on YouTube',
        url: 'https://youtube.com/playlist?list=PLy-DXclpjVLJZGXeBDY-9T2HoG708WfnX',
      },
    ],
  },
]

/* The figures on his bitcoin++ community profile. */
const bitcoinPlusPlusRecord: z.input<typeof bitcoinPlusPlusSchema> = {
  profileUrl: 'https://btcpp.dev/whois/alexlwn123',
  memberSince: 2023,
  editionsAttended: 13,
  stageSessions: 51,
  editions: [
    { city: 'Austin', year: 2023 },
    { city: 'Buenos Aires', year: 2024 },
    { city: 'Berlin', year: 2024 },
    { city: 'Florianópolis', year: 2025 },
    { city: 'Austin', year: 2025 },
    { city: 'Riga', year: 2025 },
    { city: 'Istanbul', year: 2025 },
    { city: 'Berlin', year: 2025 },
    { city: 'Taipei', year: 2025 },
    { city: 'Florianópolis', year: 2026 },
    { city: 'Las Vegas', year: 2026 },
    { city: 'Nairobi', year: 2026 },
    { city: 'Toronto', year: 2026 },
  ],
}

export const talks = parseContent(recordList(talkSchema), talkRecords, 'talks')

export const bitcoinPlusPlus = parseContent(
  bitcoinPlusPlusSchema,
  bitcoinPlusPlusRecord,
  'bitcoinPlusPlus',
)
