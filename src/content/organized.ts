import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { organizedSchema } from './schema'
import { fromOwner, fromPublicRecord } from './source'

type OrganizedInput = z.input<typeof organizedSchema>
type DateInput = NonNullable<OrganizedInput['date']>
type LocationInput = NonNullable<OrganizedInput['location']>

const on = (year: number, month: number, day: number | null = null): DateInput['start'] => ({
  year,
  month,
  day,
})

const single = (year: number, month: number, day: number | null = null): DateInput => ({
  start: on(year, month, day),
  end: null,
})

const place = (city: string, region: string | null, country: string): LocationInput => ({
  kind: 'inPerson',
  city,
  region,
  country,
})

const people = (count: number) => ({ unit: 'people', count }) as const
const aboutPeople = (count: number) => ({ unit: 'aboutPeople', count }) as const
const teams = (count: number) => ({ unit: 'teams', count }) as const
const usd = (amount: number) => ({ kind: 'usd', amount }) as const
const sats = (amount: number) => ({ kind: 'sats', amount }) as const

/** What most events leave unrecorded, and who vouches for them: he does. */
const UNRECORDED = {
  projects: null,
  role: null,
  note: null,
  source: fromOwner(),
} satisfies Partial<OrganizedInput>

const PAID_IN_BITCOIN = 'Prizes paid in bitcoin'

/*
 * Newest first. Participant and prize figures are the public Devpost figures
 * where they exist. Null means the figure is not public. An approximate head
 * count and a prize in sats are stored as what they are, and derive.ts adds
 * up neither.
 */
const records: readonly OrganizedInput[] = [
  {
    ...UNRECORDED,
    id: 'ai-hack-for-freedom-iv',
    status: 'upcoming',
    name: 'AI Hack for Freedom IV',
    date: { start: on(2026, 12, 2), end: on(2026, 12, 4) },
    location: place('San Francisco', 'CA', 'USA'),
    participants: null,
    prizes: null,
    basis: 'stated',
    source: fromPublicRecord(
      'The dates and the city were added. Nothing had been announced when he listed it.',
      'https://www.aihackforfreedom.org/',
    ),
  },
  {
    ...UNRECORDED,
    id: 'ai-hack-for-freedom-iii',
    status: 'held',
    name: 'AI Hack for Freedom III',
    date: { start: on(2026, 9, 24), end: on(2026, 9, 25) },
    location: place('Washington', 'DC', 'USA'),
    participants: teams(10),
    prizes: usd(50000),
    note: PAID_IN_BITCOIN,
    basis: 'stated',
    source: fromPublicRecord(
      'The exact dates and the $50,000 prize pool were added. The amount had been recorded as not public.',
      'https://hrf.org/latest/announcing-the-winners-of-ai-hack-for-freedom-iii/',
    ),
  },
  {
    ...UNRECORDED,
    id: 'btcpp-toronto-2026',
    status: 'held',
    name: 'bitcoin++ consensus edition',
    date: single(2026, 7),
    location: place('Toronto', null, 'Canada'),
    participants: null,
    // 17.542M sats: a prize in sats, which is never added to the dollar total.
    prizes: sats(17_542_000),
    projects: 16,
    basis: 'inferredFromProfile',
    source: fromPublicRecord(
      'The 16 projects and the 17.542M sats in prizes were added. Both had been recorded as not public.',
      'https://btcpp.dev/toronto/hackathon',
    ),
  },
  {
    ...UNRECORDED,
    id: 'btcpp-nairobi-2026',
    status: 'held',
    name: 'bitcoin++ open source edition',
    date: { start: on(2026, 6, 17), end: on(2026, 6, 18) },
    location: place('Nairobi', null, 'Kenya'),
    participants: people(90),
    prizes: usd(6180),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'ai-hack-for-freedom-ii',
    status: 'held',
    name: 'AI Hack for Freedom II',
    date: { start: on(2026, 5, 9), end: on(2026, 5, 10) },
    location: place('Nashville', 'TN', 'USA'),
    participants: teams(8),
    prizes: usd(50000),
    note: PAID_IN_BITCOIN,
    basis: 'stated',
    source: fromPublicRecord(
      'The exact dates and the $50,000 prize pool were added. The amount had been recorded as not public.',
      'https://hrf.org/latest/announcing-the-winners-of-ai-hack-for-freedom-ii/',
    ),
  },
  {
    ...UNRECORDED,
    id: 'btcpp-florianopolis-2026',
    status: 'held',
    name: 'bitcoin++ exploits edition',
    date: single(2026, 2),
    location: place('Florianópolis', null, 'Brazil'),
    // "~60 participants": an approximate head count, which is never added to the exact ones.
    participants: aboutPeople(60),
    prizes: null,
    projects: 21,
    basis: 'inferredFromProfile',
    source: fromPublicRecord(
      'About 60 participants and 21 projects were added. Both had been recorded as not public.',
      'https://insider.btcpp.dev/p/bitcoin-exploits-edition-hackathon',
    ),
  },
  {
    ...UNRECORDED,
    id: 'btcpp-taipei-2025',
    status: 'held',
    name: 'bitcoin++ sovereignty edition',
    date: single(2025, 12, 16),
    location: place('Taipei', null, 'Taiwan'),
    participants: people(58),
    prizes: usd(7785),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'lightning-pp-berlin-2025',
    status: 'held',
    name: 'Lightning++ 2025',
    date: { start: on(2025, 10, 2), end: on(2025, 10, 3) },
    location: place('Berlin', null, 'Germany'),
    participants: people(38),
    prizes: usd(15560),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-istanbul-2025',
    status: 'held',
    name: 'bitcoin++ scaling edition',
    date: single(2025, 9, 4),
    location: place('Istanbul', null, 'Türkiye'),
    participants: people(18),
    prizes: usd(7750),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-riga-2025',
    status: 'held',
    name: 'bitcoin++ privacy edition',
    date: single(2025, 8, 7),
    location: place('Riga', null, 'Latvia'),
    participants: people(29),
    prizes: usd(5700),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-austin-2025',
    status: 'held',
    name: 'bitcoin++ mempool (“pool”) edition',
    date: { start: on(2025, 5, 8), end: on(2025, 5, 9) },
    location: place('Austin', 'TX', 'USA'),
    participants: people(30),
    prizes: usd(10000),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'bitcoin-2025-official-hackathon',
    status: 'held',
    name: 'Bitcoin 2025 Official Hackathon',
    date: { start: on(2025, 4, 8), end: on(2025, 5, 20) },
    location: { kind: 'online', context: 'for the Bitcoin 2025 conference in Las Vegas' },
    participants: people(832),
    prizes: usd(58750),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-ai-turbo-austin-2025',
    status: 'held',
    name: 'bitcoin++ AI Turbo Hackathon',
    date: single(2025, 3, 11),
    location: place('Austin', 'TX', 'USA'),
    participants: people(21),
    prizes: { kind: 'nonMonetary' },
    note: 'Two hours, during SXSW',
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-florianopolis-2025',
    status: 'held',
    name: 'bitcoin++ beach edition',
    date: { start: on(2025, 2, 20), end: on(2025, 2, 22) },
    location: place('Florianópolis', null, 'Brazil'),
    participants: people(86),
    prizes: usd(15100),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'btcpp-berlin-2024',
    status: 'held',
    name: 'bitcoin++ ecash edition',
    date: { start: on(2024, 10, 11), end: on(2024, 10, 13) },
    location: place('Berlin', null, 'Germany'),
    participants: people(20),
    prizes: usd(15200),
    basis: 'stated',
  },
  {
    ...UNRECORDED,
    id: 'auburnhacks-2021',
    status: 'held',
    name: 'AuburnHacks 2021',
    date: { start: on(2021, 4, 10), end: on(2021, 4, 11) },
    location: { kind: 'online', context: null },
    participants: people(137),
    prizes: usd(15160),
    role: 'Executive director',
    basis: 'stated',
    source: fromPublicRecord(
      'His role as executive director was added.',
      'https://eng.auburn.edu/news/2021/04/auburnhacks-2021.html',
    ),
  },
  {
    ...UNRECORDED,
    id: 'auburnhacks-2020',
    status: 'held',
    name: 'AuburnHacks 2020',
    date: { start: on(2020, 2, 8), end: on(2020, 2, 9) },
    location: place('Auburn', 'AL', 'USA'),
    participants: people(112),
    prizes: usd(6340),
    basis: 'stated',
  },
]

export const organized = parseContent(recordList(organizedSchema), records, 'organized')
