import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { organizedSchema } from './schema'

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
const teams = (count: number) => ({ unit: 'teams', count }) as const
const usd = (amount: number) => ({ kind: 'usd', amount }) as const
const undisclosedBitcoin = { kind: 'bitcoin', amountPublic: false } as const

/*
 * Newest first. Participant and prize figures are the public Devpost figures
 * where they exist. Null means the figure is not public.
 */
const records: readonly OrganizedInput[] = [
  {
    id: 'ai-hack-for-freedom-iv',
    status: 'upcoming',
    name: 'AI Hack for Freedom IV',
    date: null,
    location: null,
    participants: null,
    prizes: null,
    note: null,
    basis: 'stated',
  },
  {
    id: 'ai-hack-for-freedom-iii',
    status: 'held',
    name: 'AI Hack for Freedom III',
    date: single(2026, 9),
    location: place('Washington', 'DC', 'USA'),
    participants: teams(10),
    prizes: undisclosedBitcoin,
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-toronto-2026',
    status: 'held',
    name: 'bitcoin++ consensus edition',
    date: single(2026, 7),
    location: place('Toronto', null, 'Canada'),
    participants: null,
    prizes: null,
    note: null,
    basis: 'inferredFromProfile',
  },
  {
    id: 'btcpp-nairobi-2026',
    status: 'held',
    name: 'bitcoin++ open source edition',
    date: { start: on(2026, 6, 17), end: on(2026, 6, 18) },
    location: place('Nairobi', null, 'Kenya'),
    participants: people(90),
    prizes: usd(6180),
    note: null,
    basis: 'stated',
  },
  {
    id: 'ai-hack-for-freedom-ii',
    status: 'held',
    name: 'AI Hack for Freedom II',
    date: single(2026, 5),
    location: place('Nashville', 'TN', 'USA'),
    participants: teams(8),
    prizes: undisclosedBitcoin,
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-florianopolis-2026',
    status: 'held',
    name: 'bitcoin++ exploits edition',
    date: single(2026, 2),
    location: place('Florianópolis', null, 'Brazil'),
    participants: null,
    prizes: null,
    note: null,
    basis: 'inferredFromProfile',
  },
  {
    id: 'btcpp-taipei-2025',
    status: 'held',
    name: 'bitcoin++ sovereignty edition',
    date: single(2025, 12, 16),
    location: place('Taipei', null, 'Taiwan'),
    participants: people(58),
    prizes: usd(7785),
    note: null,
    basis: 'stated',
  },
  {
    id: 'lightning-pp-berlin-2025',
    status: 'held',
    name: 'Lightning++ 2025',
    date: { start: on(2025, 10, 2), end: on(2025, 10, 3) },
    location: place('Berlin', null, 'Germany'),
    participants: people(38),
    prizes: usd(15560),
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-istanbul-2025',
    status: 'held',
    name: 'bitcoin++ scaling edition',
    date: single(2025, 9, 4),
    location: place('Istanbul', null, 'Türkiye'),
    participants: people(18),
    prizes: usd(7750),
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-riga-2025',
    status: 'held',
    name: 'bitcoin++ privacy edition',
    date: single(2025, 8, 7),
    location: place('Riga', null, 'Latvia'),
    participants: people(29),
    prizes: usd(5700),
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-austin-2025',
    status: 'held',
    name: 'bitcoin++ mempool (“pool”) edition',
    date: { start: on(2025, 5, 8), end: on(2025, 5, 9) },
    location: place('Austin', 'TX', 'USA'),
    participants: people(30),
    prizes: usd(10000),
    note: null,
    basis: 'stated',
  },
  {
    id: 'bitcoin-2025-official-hackathon',
    status: 'held',
    name: 'Bitcoin 2025 Official Hackathon',
    date: { start: on(2025, 4, 8), end: on(2025, 5, 20) },
    location: { kind: 'online', context: 'for the Bitcoin 2025 conference in Las Vegas' },
    participants: people(832),
    prizes: usd(58750),
    note: null,
    basis: 'stated',
  },
  {
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
    id: 'btcpp-florianopolis-2025',
    status: 'held',
    name: 'bitcoin++ beach edition',
    date: { start: on(2025, 2, 20), end: on(2025, 2, 22) },
    location: place('Florianópolis', null, 'Brazil'),
    participants: people(86),
    prizes: usd(15100),
    note: null,
    basis: 'stated',
  },
  {
    id: 'btcpp-berlin-2024',
    status: 'held',
    name: 'bitcoin++ ecash edition',
    date: { start: on(2024, 10, 11), end: on(2024, 10, 13) },
    location: place('Berlin', null, 'Germany'),
    participants: people(20),
    prizes: usd(15200),
    note: null,
    basis: 'stated',
  },
  {
    id: 'auburnhacks-2021',
    status: 'held',
    name: 'AuburnHacks 2021',
    date: { start: on(2021, 4, 10), end: on(2021, 4, 11) },
    location: { kind: 'online', context: null },
    participants: people(137),
    prizes: usd(15160),
    note: null,
    basis: 'stated',
  },
  {
    id: 'auburnhacks-2020',
    status: 'held',
    name: 'AuburnHacks 2020',
    date: { start: on(2020, 2, 8), end: on(2020, 2, 9) },
    location: place('Auburn', 'AL', 'USA'),
    participants: people(112),
    prizes: usd(6340),
    note: null,
    basis: 'stated',
  },
]

export const organized = parseContent(recordList(organizedSchema), records, 'organized')
