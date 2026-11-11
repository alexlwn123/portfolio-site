import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { winSchema } from './schema'
import { fromOwner, fromPublicRecord } from './source'

type WinInput = z.input<typeof winSchema>

/** What a win leaves unrecorded. Each record below states only what is known. */
const UNRECORDED = {
  edition: null,
  eventDate: null,
  eventPlace: null,
  field: null,
  announcedAs: null,
  team: null,
  description: null,
  firstWeekSats: null,
  notes: [],
  links: [],
  caveat: null,
  alsoOrganizedId: null,
  source: fromOwner(),
} satisfies Partial<WinInput>

/* Nine wins, newest first. */
const records: readonly WinInput[] = [
  {
    ...UNRECORDED,
    id: 'stringer-safety',
    year: 2026,
    event: 'AI Hack for Freedom I',
    eventDate: {
      start: { year: 2026, month: 1, day: 17 },
      end: { year: 2026, month: 1, day: 18 },
    },
    eventPlace: { venue: 'Bitcoin Park', city: 'Austin', region: 'TX' },
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Stringer Safety',
    description:
      'App that helps protect journalists in high-risk places: a trusted contact network, location and status sharing, and a one-click SOS that triggers AI response recommendations.',
    notes: ['Team captain: journalist Anjan Sundaram.', 'First-place prize: 0.5 BTC.'],
    links: [{ label: 'Post on X', url: 'https://x.com/ALewin/status/2013474336208835045' }],
    // The official pages name only the team captain. His own post places him on the team.
    source: fromPublicRecord(
      'His place on the team is now sourced to his own post on X. It replaces the caveat that it rested on his word.',
      'https://x.com/ALewin/status/2013474336208835045',
    ),
  },
  {
    ...UNRECORDED,
    id: 'lightning-welder',
    year: 2024,
    event: 'bitcoin++ Berlin, ecash edition',
    result: { kind: 'place', place: 1, qualifier: 'overall' },
    project: 'Lightning Welder',
    description: 'Helps legacy Lightning wallets pay BOLT12 offers.',
    notes: [
      'Built with Super Testnet.',
      'He also ran this hackathon and took no part in the judging. He has not competed in his own hackathons since.',
    ],
    alsoOrganizedId: 'btcpp-berlin-2024',
  },
  {
    ...UNRECORDED,
    id: 'bitdevs-upgrade',
    year: 2023,
    event: 'AI4All',
    eventDate: {
      start: { year: 2023, month: 7, day: 1 },
      end: { year: 2023, month: 7, day: 31 },
    },
    // A track prize, not a podium place.
    result: { kind: 'prize', prizeName: 'Bitcoin Education Track' },
    project: 'BitDevs Upgrade',
    announcedAs: 'BitDevs Upgraded',
    // The first line of the repository's README.
    description:
      'A project to improve the UX of BitDevs websites and add AI generated summaries to help new attendees.',
    links: [{ label: 'Code', url: 'https://github.com/atlantabitdevs/bitdevs-upgrade' }],
    caveat: 'A track prize, not a podium place: never call it first, second or third.',
    source: fromPublicRecord(
      'The year was corrected from 2024 to 2023. The dates, the name of the prize, the name it was announced under and the description were added.',
      'https://www.fedi.xyz/blog/prizes-and-promise-coming-out-of-the-ai4all-hackathon',
      'https://github.com/atlantabitdevs/bitdevs-upgrade',
    ),
  },
  {
    ...UNRECORDED,
    id: 'auntie-ln',
    year: 2023,
    event: 'SatsxSW hackathon',
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Auntie LN',
    description:
      'Proof of concept for verifiable communication between Lightning nodes over Nostr; an alternative transport layer for the Lightning Network.',
  },
  {
    ...UNRECORDED,
    id: 'last-pay-wins',
    year: 2023,
    event: 'Pleb.fi Miami',
    result: { kind: 'place', place: 2, qualifier: null },
    project: 'Last Pay Wins',
    description:
      'A game: “Reddit’s r/thebutton but with sats. Last one to pay when the timer hits zero wins.” Shows off Lightning’s instant settlement.',
    // "Collected and paid out more than 2.5 million sats in its first week."
    firstWeekSats: { sats: 2_500_000, atLeast: true },
  },
  {
    ...UNRECORDED,
    id: 'pleb-fm',
    year: 2022,
    event: 'SatsxSW hackathon',
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Pleb FM',
    description:
      'Lightning-powered jukebox and radio station: a running auction for the next song.',
    notes: ['Later raised over 2 million sats at TABConf 2023.'],
  },
  {
    ...UNRECORDED,
    id: 'arion-parking',
    year: 2022,
    event: 'Bolt.fun Shock the Web',
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Arion Parking',
    description: 'Parking app that takes payment over the Lightning Network.',
  },
  {
    ...UNRECORDED,
    id: 'treepay-ux',
    year: 2022,
    event: 'Pleb.fi Miami',
    result: { kind: 'place', place: 2, qualifier: 'tied' },
    project: 'TreePay UX',
    description: 'A user experience for congestion-controlled bitcoin transactions using CTV.',
  },
  {
    ...UNRECORDED,
    id: 'ncr-global-hackathon-2021',
    year: 2021,
    event: 'NCR Global Hackathon',
    edition: '3rd annual',
    result: { kind: 'place', place: 1, qualifier: null },
    field: { unit: 'teams', count: 300, atLeast: true },
    // Neither the project's name nor what it did is recorded anywhere he has pointed to.
    project: null,
    team: {
      name: 'Eth Heads',
      teammates: [
        'Bryan W. Nonni',
        'Sam (Abdulwahab) Jarkas',
        'Christian McDaniel',
        'Stefan Bjelcevic',
        'Jay Arcement',
      ],
    },
    links: [
      {
        label: 'Post on LinkedIn',
        url: 'https://www.linkedin.com/posts/alex-lewin1_its-been-a-wild-first-month-in-the-real-share-6829077224755392512-INuT/',
      },
    ],
    // He gave this win himself. The post he linked, which he reshared on 2021-08-05, backs it up.
    source: fromOwner(
      'https://www.linkedin.com/posts/alex-lewin1_its-been-a-wild-first-month-in-the-real-share-6829077224755392512-INuT/',
    ),
  },
]

export const wins = parseContent(recordList(winSchema), records, 'wins')
