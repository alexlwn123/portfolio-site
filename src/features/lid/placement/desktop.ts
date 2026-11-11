import { STICKER_IDS, type StickerId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { parseLayout, type Placement } from './schema'

/*
 * The approved arrangement, lifted from the coordinates in
 * design/mockups/01-first-screen.html: x, y and width in design units on the
 * 728-wide artboard, tilt in degrees, and the layer each sticker sits on.
 * The lanyard and the badge share an anchor so that they swing as one.
 *
 * Three things were added after the mockup (see "Additions since the mockup"
 * in design/mockups/DEVIATIONS.md). The medal sits in the V of the lanyard and
 * the compliance label in the gap between the bumper and Pleb FM, a layer
 * below both. The fifth ribbon hangs 35 units lower than the fourth, so the
 * Berlin, Toronto and Austin pills moved down to clear it: they are the only
 * stickers of the mockup that are not where it put them.
 *
 * The three buttons came with the interaction layer and sit where the lid was
 * bare: the speaker and "tilt me" between the name and the strap, and "tidy
 * the lid" in the gap above the bumper. None of them is over another sticker.
 */
const placements: Record<StickerId, Placement> = {
  name: { x: 14, y: 30, w: 470, r: -4, z: 6 },
  lanyard: { x: 458, y: -40, w: 260, r: 0, z: 2 },
  badge: { x: 458, y: -40, w: 260, r: 0, z: 9 },
  hello: { x: 26, y: 314, w: 410, r: 1.5, z: 5 },
  cv: { x: 20, y: 456, w: 226, r: -3, z: 8 },
  'wins-count': { x: 264, y: 434, w: 190, r: 9, z: 7 },
  'organized-count': { x: 26, y: 532, w: 212, r: -8, z: 6 },
  'latest-win': { x: 212, y: 636, w: 258, r: -4, z: 7 },
  'ncr-win': { x: 532, y: 0, w: 112, r: -7, z: 4 },
  'bolt-top': { x: 436, y: 392, w: 58, r: 14, z: 8 },
  'city-nairobi': { x: 8, y: 770, r: -7, z: 3 },
  'city-taipei': { x: 98, y: 790, r: 5, z: 3 },
  'city-riga': { x: 174, y: 776, r: -6, z: 3 },
  'city-istanbul': { x: 232, y: 794, r: 4, z: 3 },
  'city-florianopolis': { x: 330, y: 776, r: -5, z: 3 },
  'city-berlin': { x: 402, y: 818, r: 6, z: 8 },
  'city-toronto': { x: 556, y: 816, r: -4, z: 8 },
  'city-austin': { x: 644, y: 822, r: 8, z: 8 },
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
  patents: { x: 238, y: 957, w: 150, r: -2.5, z: 4 },
  elsewhere: { x: -26, y: 1222, w: 412, r: -2.5, z: 9 },
  'more-elsewhere': { x: 372, y: 1236, w: 384, r: 1.5, z: 8 },
  tilt: { x: 478, y: 196, w: 58, r: -6, z: 8 },
  sound: { x: 470, y: 108, w: 46, r: 8, z: 8 },
  tidy: { x: 14, y: 806, w: 66, r: -5, z: 8 },
}

export const desktop = parseLayout('desktop', STICKER_IDS, ARTBOARDS.desktop, placements)
