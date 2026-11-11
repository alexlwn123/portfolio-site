import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { winSchema } from './schema'

/* Eight wins by his own count, newest first. */
const records: readonly z.input<typeof winSchema>[] = [
  {
    id: 'stringer-safety',
    year: 2026,
    event: 'AI Hack for Freedom I',
    eventDate: {
      start: { year: 2026, month: 1, day: 17 },
      end: { year: 2026, month: 1, day: 18 },
    },
    eventPlace: 'Bitcoin Park, Austin, TX',
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Stringer Safety',
    description:
      'App that helps protect journalists in high-risk places: a trusted contact network, location and status sharing, and a one-click SOS that triggers AI response recommendations.',
    notes: ['Team captain: journalist Anjan Sundaram.', 'First-place prize: 0.5 BTC.'],
    caveat:
      'The official pages name only the team captain, so his place on the team is on his word.',
    alsoOrganizedId: null,
  },
  {
    id: 'lightning-welder',
    year: 2024,
    event: 'bitcoin++ Berlin, ecash edition',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 1, qualifier: 'overall' },
    project: 'Lightning Welder',
    description: 'Helps legacy Lightning wallets pay BOLT12 offers.',
    notes: [
      'Built with Super Testnet.',
      'He also ran this hackathon and took no part in the judging. He has not competed in his own hackathons since.',
    ],
    caveat: null,
    alsoOrganizedId: 'btcpp-berlin-2024',
  },
  {
    id: 'bitdevs-upgrade',
    year: 2024,
    event: 'AI4All',
    eventDate: null,
    eventPlace: null,
    // A prize, not a podium place. The prize's exact name is not recorded.
    result: { kind: 'prize', prizeName: null },
    project: 'BitDevs Upgrade',
    description: null,
    notes: [],
    caveat:
      'He recalls an educational prize. It was not a podium place: never call it first, second or third.',
    alsoOrganizedId: null,
  },
  {
    id: 'auntie-ln',
    year: 2023,
    event: 'SatsxSW hackathon',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Auntie LN',
    description:
      'Proof of concept for verifiable communication between Lightning nodes over Nostr; an alternative transport layer for the Lightning Network.',
    notes: [],
    caveat: null,
    alsoOrganizedId: null,
  },
  {
    id: 'last-pay-wins',
    year: 2023,
    event: 'Pleb.fi Miami',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 2, qualifier: null },
    project: 'Last Pay Wins',
    description:
      'A game: “Reddit’s r/thebutton but with sats. Last one to pay when the timer hits zero wins.” Shows off Lightning’s instant settlement.',
    notes: ['Collected and paid out more than 2.5 million sats in its first week.'],
    caveat: null,
    alsoOrganizedId: null,
  },
  {
    id: 'pleb-fm',
    year: 2022,
    event: 'SatsxSW hackathon',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Pleb FM',
    description:
      'Lightning-powered jukebox and radio station: a running auction for the next song.',
    notes: ['Later raised over 2 million sats at TABConf 2023.'],
    caveat: null,
    alsoOrganizedId: null,
  },
  {
    id: 'arion-parking',
    year: 2022,
    event: 'Bolt.fun Shock the Web',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 1, qualifier: null },
    project: 'Arion Parking',
    description: 'Parking app that takes payment over the Lightning Network.',
    notes: [],
    caveat: null,
    alsoOrganizedId: null,
  },
  {
    id: 'treepay-ux',
    year: 2022,
    event: 'Pleb.fi Miami',
    eventDate: null,
    eventPlace: null,
    result: { kind: 'place', place: 2, qualifier: 'tied' },
    project: 'TreePay UX',
    description: 'A user experience for congestion-controlled bitcoin transactions using CTV.',
    notes: [],
    caveat: null,
    alsoOrganizedId: null,
  },
]

export const wins = parseContent(recordList(winSchema), records, 'wins')
