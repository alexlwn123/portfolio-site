import { ARTBOARDS } from '../src/features/lid/placement/artboards'
import { STICKER_IDS, type StickerId } from '../src/features/lid/stickers'

/*
 * Where design/mockups/01-first-screen.html stuck each sticker: its own --x,
 * --y, --w, --r and --z, on an artboard 728 by 1300. The lid's arrangement
 * has moved on since: it is a cover and a pile now, each with artboards of
 * its own (see "Round 3" in design/mockups/DEVIATIONS.md). So the comparison
 * with the mockup first takes the two blocks away and puts the lid's stickers
 * back on one stage, where the mockup had them. What is compared is how each
 * sticker is drawn, not where it is stuck.
 */

interface Place {
  readonly x: number
  readonly y: number
  readonly w?: number
  readonly r: number
  readonly z: number
}

/** The mockup is one unit to the pixel at this width, and this tall. */
export const MOCKUP_SIZE = Object.freeze({ width: ARTBOARDS.desktop.width, height: 1300 })

/** Every sticker the mockup has, by the id the lid gives it. */
export const MOCKUP_ARRANGEMENT = Object.freeze({
  name: { x: 14, y: 30, w: 470, r: -4, z: 6 },
  lanyard: { x: 458, y: -40, w: 260, r: 0, z: 2 },
  badge: { x: 458, y: -40, w: 260, r: 0, z: 9 },
  hello: { x: 26, y: 314, w: 410, r: 1.5, z: 5 },
  cv: { x: 20, y: 456, w: 226, r: -3, z: 8 },
  'wins-count': { x: 264, y: 434, w: 190, r: 9, z: 7 },
  'organized-count': { x: 26, y: 532, w: 212, r: -8, z: 6 },
  'latest-win': { x: 212, y: 636, w: 258, r: -4, z: 7 },
  'bolt-top': { x: 436, y: 392, w: 58, r: 14, z: 8 },
  'city-nairobi': { x: 8, y: 770, r: -7, z: 3 },
  'city-taipei': { x: 98, y: 790, r: 5, z: 3 },
  'city-riga': { x: 174, y: 776, r: -6, z: 3 },
  'city-istanbul': { x: 232, y: 794, r: 4, z: 3 },
  'city-florianopolis': { x: 330, y: 776, r: -5, z: 3 },
  'city-berlin': { x: 476, y: 800, r: 6, z: 8 },
  'city-toronto': { x: 556, y: 788, r: -4, z: 8 },
  'city-austin': { x: 644, y: 806, r: 8, z: 8 },
  workshop: { x: 20, y: 850, w: 380, r: -3, z: 5 },
  'last-pay-wins': { x: 404, y: 836, w: 196, r: 6, z: 6 },
  'arion-parking': { x: 606, y: 868, w: 112, r: -7, z: 6 },
  'clawthing-store': { x: 6, y: 976, w: 210, r: 5, z: 7 },
  'pleb-fm': { x: 228, y: 1010, w: 232, r: -2, z: 6 },
  'bitcoin-plus-plus': { x: 598, y: 1026, w: 126, r: 7, z: 7 },
  'lightning-welder': { x: 446, y: 1046, w: 156, r: -6, z: 6 },
  phrase: { x: 24, y: 1172, r: -4, z: 8 },
  'next-spot': { x: 236, y: 1110, w: 196, r: 3, z: 1 },
  tally: { x: 670, y: 94, w: 46, r: 7, z: 1 },
  'bolt-bottom': { x: 652, y: 1168, w: 50, r: -16, z: 8 },
  elsewhere: { x: -26, y: 1222, w: 412, r: -2.5, z: 9 },
  'more-elsewhere': { x: 372, y: 1236, w: 384, r: 1.5, z: 8 },
} satisfies Partial<Record<StickerId, Place>>)

export type MockupStickerId = keyof typeof MOCKUP_ARRANGEMENT

function isOnMockup(id: StickerId): id is MockupStickerId {
  return id in MOCKUP_ARRANGEMENT
}

/** Stuck on since the mockup was approved, so it has nothing to be compared with. */
export const ADDED_SINCE = STICKER_IDS.filter((id) => !isOnMockup(id))

function px(value: number): string {
  return `${String(value)}px`
}

/**
 * The lid as one stage again: the cover, its column and the pile stop being
 * blocks that stickers are placed against, take no room, and count one unit
 * to the pixel, as the mockup does at its own width.
 */
function oneStageCss(): string {
  const blocks = ['[data-lid-cover]', '[data-lid-board]', '[data-lid-pile]']
    .map((block) => `[data-lid-stage] ${block}`)
    .join(',')
  const flat = [
    'position:static',
    'width:auto',
    'max-width:none',
    'height:0',
    'min-height:0',
    'margin:0',
    'font-size:10px',
  ]

  return [
    `[data-lid-stage]{height:${px(MOCKUP_SIZE.height)}}`,
    `${blocks}{${flat.join(';')}}`,
  ].join('\n')
}

/**
 * A stylesheet that lays the lid out as the mockup is laid out: every sticker
 * the mockup has goes back to the mockup's place, and what has been added
 * since is taken off. It is written for the mockup's own width only.
 */
export function mockupArrangementCss(): string {
  const placed = Object.entries<Place>(MOCKUP_ARRANGEMENT).map(([id, { x, y, w, r, z }]) => {
    const lines = [
      `left:${px(x)}`,
      `top:${px(y)}`,
      // The cover measures some of its stickers from the right or from the bottom.
      'right:auto',
      'bottom:auto',
      ...(w === undefined ? [] : [`width:${px(w)}`]),
      `rotate:${String(r)}deg`,
      `z-index:${String(z)}`,
    ]
    return `[data-lid-stage] [data-sticker="${id}"]{${lines.join(';')}}`
  })
  const removed = ADDED_SINCE.map((id) => `[data-lid-stage] [data-sticker="${id}"]{display:none}`)

  return [oneStageCss(), ...placed, ...removed].join('\n')
}
