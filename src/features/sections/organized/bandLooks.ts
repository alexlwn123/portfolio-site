import type { Organized } from '../../../content'

/*
 * What each wristband is made of. Which band a hackathon wears is a design
 * decision, taken in the approved mockup (design/mockups/02-wristbands.html)
 * and written here. What is lettered on it is not: that is read from the
 * record by eventLabels.ts.
 */

/** The colour a band is cut from. */
export type BandTone = 'mint' | 'tang' | 'hi' | 'cobalt' | 'white' | 'ink' | 'sky' | 'deep'

/** The printed block at the clasp end of a paper band. */
export type BandPattern =
  'stripes' | 'checker' | 'hazard' | 'zig' | 'lines' | 'bars' | 'tiles' | 'dots'

/** The two colours woven along the edges of a cloth band. */
export type BandWeave = 'inkTang' | 'tangCobalt' | 'skyCobalt'

export type BandLook =
  /** Paper, with a printed block and a loose tail. Thin for a hackathon of two hours. */
  | {
      readonly kind: 'tyvek'
      readonly tone: BandTone
      readonly pattern: BandPattern
      readonly thin: boolean
    }
  /** Cloth, with a sliding bead. */
  | { readonly kind: 'woven'; readonly tone: BandTone; readonly weave: BandWeave }
  /** Moulded silicone, debossed. */
  | { readonly kind: 'silicone'; readonly tone: BandTone }
  /** Holographic: the big one. */
  | { readonly kind: 'foil' }
  /** Not printed yet. */
  | { readonly kind: 'blank' }

const paper = (tone: BandTone, pattern: BandPattern, thin = false): BandLook => ({
  kind: 'tyvek',
  tone,
  pattern,
  thin,
})

const cloth = (tone: BandTone, weave: BandWeave): BandLook => ({ kind: 'woven', tone, weave })

/** The bands of the approved mockup, by the hackathon that wears each. */
export const HAND_SET_LOOKS: Readonly<Record<string, BandLook>> = Object.freeze({
  'ai-hack-for-freedom-iii': paper('mint', 'stripes'),
  'btcpp-toronto-2026': paper('tang', 'checker'),
  'btcpp-nairobi-2026': cloth('hi', 'inkTang'),
  'ai-hack-for-freedom-ii': paper('mint', 'stripes'),
  'btcpp-florianopolis-2026': paper('cobalt', 'hazard'),
  'btcpp-taipei-2025': cloth('white', 'tangCobalt'),
  'lightning-pp-berlin-2025': paper('hi', 'zig'),
  'btcpp-istanbul-2025': paper('tang', 'lines'),
  'btcpp-riga-2025': paper('ink', 'bars'),
  'btcpp-austin-2025': paper('sky', 'tiles'),
  'bitcoin-2025-official-hackathon': { kind: 'foil' },
  'btcpp-ai-turbo-austin-2025': paper('white', 'dots', true),
  'btcpp-florianopolis-2025': cloth('hi', 'skyCobalt'),
  'btcpp-berlin-2024': paper('mint', 'dots'),
  'auburnhacks-2021': { kind: 'silicone', tone: 'deep' },
  'auburnhacks-2020': { kind: 'silicone', tone: 'tang' },
})

/**
 * For a hackathon held after the mockup was drawn, until somebody picks its
 * band: these are worn in turn, by the band's place on the arm.
 */
export const FALLBACK_LOOKS: readonly BandLook[] = Object.freeze([
  paper('hi', 'checker'),
  cloth('white', 'inkTang'),
  paper('tang', 'dots'),
  paper('mint', 'zig'),
  cloth('hi', 'tangCobalt'),
  paper('sky', 'lines'),
])

const BLANK: BandLook = Object.freeze({ kind: 'blank' })

/** The band a hackathon wears. `index` is its place on the arm, from the wrist. */
export function bandLook(event: Organized, index: number): BandLook {
  if (event.status === 'upcoming') {
    return BLANK
  }
  return HAND_SET_LOOKS[event.id] ?? FALLBACK_LOOKS[index % FALLBACK_LOOKS.length] ?? BLANK
}
