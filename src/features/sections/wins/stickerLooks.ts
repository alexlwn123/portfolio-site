import type { WinFacts } from './winFacts'

/*
 * The shape each prize sticker is cut in. What a sticker is cut from is not
 * decided here: a first is holographic foil, a second is brushed silver, and
 * that follows from the result (see winFacts.ts). The shape is a design
 * decision, written here win by win, with two rules: a prize that was not a
 * place takes a shape that no place has, and a first place is never cut low
 * and wide, because a first is the largest sticker on the sheet and a slab or
 * a ticket covers the least of it.
 */

export type StickerShape =
  'slab' | 'hex' | 'round' | 'medal' | 'burst' | 'ticket' | 'shield' | 'rosette'

export interface StickerLook {
  readonly shape: StickerShape
  /** True when a corner has started to lift off the sheet. */
  readonly lifting: boolean
}

type PlaceShape = Exclude<StickerShape, 'rosette'>

/** The shape a prize takes, and no place does. */
const PRIZE_SHAPE = 'rosette' satisfies StickerShape

const flat = (shape: StickerShape): StickerLook => ({ shape, lifting: false })
const lifting = (shape: StickerShape): StickerLook => ({ shape, lifting: true })

/** The stickers as drawn, by the win each is for. */
export const HAND_SET_LOOKS: Readonly<Record<string, StickerLook>> = Object.freeze({
  'stringer-safety': flat('slab'),
  'lightning-welder': flat('hex'),
  'bitdevs-upgrade': flat(PRIZE_SHAPE),
  'auntie-ln': flat('round'),
  'last-pay-wins': lifting('ticket'),
  'pleb-fm': flat('burst'),
  'arion-parking': flat('shield'),
  'treepay-ux': lifting('slab'),
  'ncr-global-hackathon-2021': flat('medal'),
})

/** For a win added after these were drawn, until somebody draws its sticker: taken in turn. */
export const FALLBACK_SHAPES: readonly PlaceShape[] = Object.freeze([
  'round',
  'slab',
  'hex',
  'shield',
  'burst',
  'ticket',
])

/** The sticker a win gets. `index` is its place on the sheet, newest first. */
export function stickerLook(win: Pick<WinFacts, 'id' | 'finish'>, index: number): StickerLook {
  const drawn = HAND_SET_LOOKS[win.id]
  if (drawn !== undefined) {
    return drawn
  }
  if (win.finish === 'prize') {
    return flat(PRIZE_SHAPE)
  }
  return flat(FALLBACK_SHAPES[index % FALLBACK_SHAPES.length] ?? 'round')
}
