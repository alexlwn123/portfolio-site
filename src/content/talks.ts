import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { bitcoinPlusPlusSchema, talkSchema } from './schema'
import { fromOwner, fromPublicRecord } from './source'

type TalkInput = z.input<typeof talkSchema>

const on = (year: number, month: number | null = null, day: number | null = null) =>
  ({ kind: 'date', date: { year, month, day } }) as const

const confirmed = (name: string) => ({ name, confirmed: true }) as const

/** What most talks leave unrecorded, and who vouches for them: he does. */
const UNRECORDED = {
  format: null,
  role: null,
  detail: null,
  alsoListedAs: null,
  links: [],
  source: fromOwner(),
} satisfies Partial<TalkInput>

/*
 * Talks, workshops, panels and podcasts: the dated ones newest first, then
 * the show he co-hosts. For a podcast the venue is the show and the episode.
 * A record marked fromPublicRecord was found, dated or corrected by web
 * research and still waits for his confirmation.
 */
const talkRecords: readonly TalkInput[] = [
  {
    ...UNRECORDED,
    id: 'the-alex-lewin-experience',
    when: on(2026, 10, 14),
    title: 'The Alex Lewin Experience',
    detail: 'A one-hour Bitcoin agent hack-and-tell',
    venue: confirmed('TABConf 8'),
    links: [
      { label: 'Session on GitHub', url: 'https://github.com/TABConf/8.tabconf.com/issues/82' },
    ],
    source: fromPublicRecord(
      'Added. The session page gives the title, the date and the one-hour slot. It does not carry the description, “Bitcoin agent hack-and-tell”: its details are still to be announced.',
      'https://github.com/TABConf/8.tabconf.com/issues/82',
    ),
  },
  {
    ...UNRECORDED,
    id: 'bitcoin-takeover-s17-e46',
    when: on(2026, 10, 14),
    title: 'Livestream from TABConf 8, Part 1',
    format: 'podcast',
    role: 'guest',
    venue: confirmed('Bitcoin Takeover, S17 E46'),
    links: [
      {
        label: 'Episode page',
        url: 'https://bitcoin-takeover.com/s17-e46-livestream-from-tabconf-8-part-1-feat-paul-sztorc-andre-beganski-alex-lewin-janusz-christopher-allen-will-michael-tidwell/',
      },
    ],
    source: fromPublicRecord(
      'Added. He is one of the guests the episode names. The episode page went up on October 15; the date here is the day of the livestream.',
      'https://bitcoin-takeover.com/s17-e46-livestream-from-tabconf-8-part-1-feat-paul-sztorc-andre-beganski-alex-lewin-janusz-christopher-allen-will-michael-tidwell/',
    ),
  },
  {
    ...UNRECORDED,
    id: 'teaching-ai-as-a-tool-for-freedom',
    when: on(2026, 8, 5),
    title: 'Teaching AI As a Tool for Freedom',
    format: 'discussion',
    detail: 'With the Human Rights Foundation',
    venue: confirmed('PubKey, New York City'),
    links: [
      { label: 'Broadcast on X', url: 'https://x.com/i/broadcasts/1nKOLLlZEprGR' },
      { label: 'Event page', url: 'https://luma.com/pubkey-jj3u' },
    ],
    source: fromPublicRecord(
      'The day was added: it had been recorded as August 2026.',
      'https://luma.com/pubkey-jj3u',
    ),
  },
  {
    ...UNRECORDED,
    id: 'elevating-the-ux-of-self-custody',
    when: on(2026, 4, 29),
    title: 'Elevating the User Experience of Self-Custody',
    format: 'panel',
    role: 'moderator',
    venue: confirmed('Bitcoin 2026'),
    links: [
      {
        label: 'Agenda',
        url: 'https://conference-2026.b.tc/agenda/features-that-make-self-custody-easier-than-using-a-custodian-miniscript-threshold-sigs-ux-more',
      },
    ],
    source: fromPublicRecord(
      'Added. The agenda lists him as the moderator.',
      'https://conference-2026.b.tc/agenda/features-that-make-self-custody-easier-than-using-a-custodian-miniscript-threshold-sigs-ux-more',
    ),
  },
  {
    ...UNRECORDED,
    id: 'lightning-plus-ecash',
    when: on(2026, 4, 28),
    title: 'Lightning + Ecash: An Atomic Match Made in Heaven?',
    format: 'panel',
    role: 'panelist',
    venue: confirmed('Bitcoin 2026'),
    links: [
      {
        label: 'Agenda',
        url: 'https://conference-2026.b.tc/agenda/lightning-ecash-an-atomic-match-made-in-heaven',
      },
    ],
    source: fromPublicRecord(
      'Added. The agenda lists him among the speakers.',
      'https://conference-2026.b.tc/agenda/lightning-ecash-an-atomic-match-made-in-heaven',
    ),
  },
  {
    ...UNRECORDED,
    id: 'sovereign-banks-fedi',
    when: on(2025, 12, 15),
    title: 'Building Sovereign Banks with Fedi',
    format: 'workshop',
    detail: '“Recreating sovereign community banks with chaumian ecash mints + bitcoin”',
    // The CV file listed this a second time under this name, undated and at an unconfirmed venue.
    alsoListedAs: 'Building Sovereign Banks with Fedimint',
    venue: confirmed('bitcoin++ Taipei'),
    links: [{ label: 'Video on YouTube', url: 'https://youtu.be/-anhf5szB2I' }],
    source: fromPublicRecord(
      'Two rows were merged into this one: the undated “Building Sovereign Banks with Fedimint”, with its unconfirmed Bitcoin Park venue, is this workshop, and the video is of it.',
      'https://youtu.be/-anhf5szB2I',
    ),
  },
  {
    ...UNRECORDED,
    id: 'scaling-lightning',
    when: on(2025, 10, 3),
    title: 'Scaling Lightning',
    format: 'panel',
    detail: 'With Calle, Evan Kaloudis, Shinobi and Walton',
    venue: confirmed('Lightning++ Berlin'),
    links: [{ label: 'Video on YouTube', url: 'https://www.youtube.com/watch?v=oFDaC_2WjP0' }],
  },
  {
    ...UNRECORDED,
    id: 'how-to-win-every-hackathon',
    when: on(2025, 2, 20),
    title: 'How to Win Every Hackathon',
    format: 'workshop',
    venue: confirmed('bitcoin++ Florianópolis'),
    links: [{ label: 'Video on YouTube', url: 'https://www.youtube.com/watch?v=X9yLrPk_LnE' }],
  },
  {
    ...UNRECORDED,
    id: 'fedimint-sdk-workshop',
    when: on(2024, 12, 8),
    title: 'Fedimint SDK workshop',
    format: 'workshop',
    venue: confirmed('Btrust Developer Day, Africa Bitcoin Conference 2024, Nairobi'),
    links: [{ label: 'Post on X', url: 'https://x.com/ALewin/status/1861778110120591373' }],
    // The research gave this date and city without an address to check them against.
    source: fromPublicRecord(
      'The day and the city were added: it had been recorded as 2024. No source address came with them.',
    ),
  },
  {
    ...UNRECORDED,
    id: 'fedimint-wallet-in-20-minutes',
    when: on(2024, 10, 11),
    title: 'How to build a Fedimint wallet in 20 minutes (without Rust)',
    alsoListedAs: 'Fedimint SDK Deep Dive',
    venue: confirmed('bitcoin++ Berlin'),
    links: [{ label: 'Video on YouTube', url: 'https://youtu.be/KCZ6y2ufavw' }],
  },
  {
    ...UNRECORDED,
    id: 'how-ecash-works',
    when: on(2024, 8, 7),
    title: 'How eCash Works with Alex Lewin',
    format: 'talk',
    venue: confirmed('ATL BitLab'),
    links: [
      {
        label: 'Event page on Meetup',
        url: 'https://www.meetup.com/atlantabitdevs/events/302064507/',
      },
    ],
    source: fromPublicRecord('Added.', 'https://www.meetup.com/atlantabitdevs/events/302064507/'),
  },
  {
    ...UNRECORDED,
    id: 'fun-with-lightning',
    when: on(2024, 2, 23),
    title: 'Fun with Lightning: How to Win Every Bitcoin Hackathon',
    format: 'workshop',
    venue: confirmed('bitcoin++ Buenos Aires'),
  },
  {
    ...UNRECORDED,
    id: 'extending-bitcoin-with-zk-proofs',
    when: on(2023, 12, 13),
    title: 'Extending Bitcoin with Zero-knowledge Proofs',
    format: 'talk',
    venue: confirmed('Atlanta BitDevs'),
    links: [
      {
        label: 'Event page on Meetup',
        url: 'https://www.meetup.com/atlantabitdevs/events/297663546',
      },
    ],
    source: fromPublicRecord('Added.', 'https://www.meetup.com/atlantabitdevs/events/297663546'),
  },
  {
    ...UNRECORDED,
    id: 'ai-unchained-003',
    when: on(2023, 6, 10),
    title: 'The Dark Side of Ai with Alex Lewin',
    format: 'podcast',
    role: 'guest',
    venue: confirmed('AI Unchained, Ai_003'),
    links: [
      {
        label: 'Episode page',
        url: 'https://ai-unchained.castos.com/episodes/003-the-dark-side-of-ai-with-alex-lewin',
      },
    ],
    source: fromPublicRecord(
      'Added.',
      'https://ai-unchained.castos.com/episodes/003-the-dark-side-of-ai-with-alex-lewin',
    ),
  },
  {
    ...UNRECORDED,
    id: 'state-of-bitcoin-67',
    // The day is not verified, so the date stops at the month.
    when: on(2023, 3),
    title: 'Big Dev Energy with Alex Lewin',
    format: 'podcast',
    role: 'guest',
    venue: confirmed('State of Bitcoin, Ep. 67'),
    links: [
      {
        label: 'Episode on Spotify',
        url: 'https://open.spotify.com/episode/3YN675Ihwk2162JCAyWX7P',
      },
    ],
    source: fromPublicRecord(
      'Added. The day in March 2023 is not verified.',
      'https://open.spotify.com/episode/3YN675Ihwk2162JCAyWX7P',
    ),
  },
  {
    ...UNRECORDED,
    id: 'bitdevs-radio-hour',
    when: { kind: 'ongoing' },
    title: 'BitDevs Radio Hour',
    format: 'podcast',
    role: 'coHost',
    detail: 'A weekly podcast on technical bitcoin news, with Stephen DeLorme',
    venue: null,
    links: [
      {
        label: 'Playlist on YouTube',
        url: 'https://youtube.com/playlist?list=PLy-DXclpjVLJZGXeBDY-9T2HoG708WfnX',
      },
      { label: 'Apple Podcasts', url: 'https://podcasts.apple.com/podcast/id1791756302' },
    ],
    source: fromPublicRecord(
      'His role was added: he co-hosts the show with Stephen DeLorme. No role had been recorded.',
      'https://podcasts.apple.com/podcast/id1791756302',
    ),
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
