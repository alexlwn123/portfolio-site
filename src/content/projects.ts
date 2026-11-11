import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { projectSchema } from './schema'

type ProjectInput = z.input<typeof projectSchema>
type LinkInput = ProjectInput['links'][number]

const code = (url: string): LinkInput => ({ label: 'Code', url })
const site = (url: string): LinkInput => ({ label: 'Site', url })
const video = (url: string): LinkInput => ({ label: 'Video', url })

interface ProjectOptions {
  readonly note?: string
  readonly unverifiedClaim?: string
  readonly confirmed?: boolean
}

function project(
  id: string,
  name: string,
  description: string,
  links: readonly LinkInput[],
  options: ProjectOptions = {},
): ProjectInput {
  return {
    id,
    name,
    description,
    winId: null,
    note: options.note ?? null,
    unverifiedClaim: options.unverifiedClaim ?? null,
    confirmed: options.confirmed ?? true,
    links: [...links],
  }
}

/** A project the file describes with "See wins": the win holds the description. */
function winner(id: string, name: string, links: readonly LinkInput[]): ProjectInput {
  return {
    id,
    name,
    description: null,
    winId: id,
    note: null,
    unverifiedClaim: null,
    confirmed: true,
    links: [...links],
  }
}

/* From his GitHub profile, in the order he lists them. Descriptions are his. */
const records: readonly ProjectInput[] = [
  project('btc-plinko', 'BTC Plinko', 'Plinko with sats.', [
    code('https://github.com/alexlwn123/btc-plinko'),
  ]),
  project(
    'cargo-leaderboard',
    'Cargo Leaderboard',
    'A Rust competition for the biggest builds, biggest cleans, and longest compile times.',
    [code('https://github.com/alexlwn123/cargo-leaderboard')],
  ),
  project(
    'finite-computer',
    'Finite Computer',
    'Open-source AI agent platform spanning chat, private compute, hosted sites, search, and skills.',
    [code('https://github.com/finitecomputer/finite-mono')],
    { note: 'His employer.' },
  ),
  project(
    'clawthing-store',
    'Clawthing Store',
    'AI-designed crab merch and apparel. Marketed towards agents.',
    [site('https://clawthing.store')],
  ),
  project('fedimint-sdk', 'Fedimint SDK', 'Tools for developing Fedimint clients.', [
    code('https://github.com/fedimint/fedimint-sdk'),
  ]),
  project(
    'web-to-svg-extension',
    'Web to SVG Extension',
    'Chromium extension to capture any DOM element as PNG, JPEG, or SVG.',
    [code('https://github.com/alexlwn123/web-to-svg-extension')],
  ),
  project(
    'bitcoinramps',
    'BitcoinRamps',
    'Compare fees, spreads, privacy, and KYC requirements across top Bitcoin exchanges.',
    [site('https://bitcoinramps.com')],
  ),
  winner('last-pay-wins', 'Last Pay Wins', [
    site('https://lastpaywins.com'),
    code('https://github.com/alexlwn123/LastPayWins'),
  ]),
  winner('pleb-fm', 'Pleb FM', [
    site('https://pleb.fm'),
    code('https://github.com/PlebFM/PlebFM'),
    { label: 'Demo video', url: 'https://youtu.be/_AwXSzzc9k0?t=839' },
  ]),
  project(
    'rough-consensus',
    'Rough Consensus',
    'Oxford-style debate voting platform. Used for live debates at bitcoin++ mempool edition 2025.',
    [code('https://github.com/alexlwn123/Rough-Consensus')],
  ),
  winner('lightning-welder', 'Lightning Welder', [
    code('https://github.com/alexlwn123/Lightning-Welder'),
  ]),
  winner('arion-parking', 'Arion Parking', [
    site('https://arionparking.tech'),
    code('https://github.com/atlantabitdevs/park-lightning'),
    video('https://www.youtube.com/watch?v=kMpse9ChX3g'),
  ]),
  winner('auntie-ln', 'Auntie LN', [
    { label: 'Project page', url: 'https://bolt.fun/project/auntie-ln' },
    code('https://github.com/alexlwn123/thunderhub'),
    video('https://youtu.be/JB5tyLmPBqU'),
  ]),
  winner('treepay-ux', 'TreePay UX', [code('https://github.com/atlantabitdevs/treepay-ux')]),
  project(
    'chesscup-hack',
    'Chesscup Hack',
    'Bot that uses browser automation to solve puzzles on chesscup.org.',
    [code('https://github.com/alexlwn123/Chesscup-hack')],
    {
      // Whether this still holds is unknown, so it stays out of the description.
      unverifiedClaim: 'His site says it “currently holds all world records on the site”.',
    },
  ),
  project('tapass-fun', 'Tapass.fun', 'pump.fun parody for Lightning Labs’s Taproot Assets.', [
    code('https://github.com/alexlwn123/TapassFun'),
  ]),
  project('kattis', 'kattis', 'Solved Kattis competitive programming problems.', [
    code('https://github.com/alexlwn123/kattis'),
  ]),
  winner('stringer-safety', 'Stringer Safety', [site('https://stringersafety.com')]),
  project(
    'agent-camp-hack-and-tell',
    'Agent Camp Hack-and-Tell',
    'A 2.5-hour workshop he runs on Finite: attendees build and publish an app with their own AI agent, then present it.',
    [site('https://hack--hack.finite.place')],
    // From a local project, not his public profile: confirm before featuring.
    { confirmed: false },
  ),
]

export const projects = parseContent(recordList(projectSchema), records, 'projects')
