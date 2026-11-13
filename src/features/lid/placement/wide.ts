import { PILE_IDS, type PileId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { parseLayout, type Placement } from './schema'

/*
 * The pile on a laptop, hand-set on the 1100-wide artboard: x, y and width in
 * design units, tilt in degrees, and the layer each sticker sits on. Its main
 * mass sits in the column, from x=50 to x=1050: the heading on the left edge,
 * as every section's is, then where he has worked and the two counts, the
 * wins and the projects, the cities, and last the links and the small print.
 */
const placements: Record<PileId, Placement> = {
  'pile-title': { x: 50, y: 60, r: -2.5, z: 5 },
  'pile-kicker': { x: 58, y: 226, w: 360, r: -1.5, z: 2 },
  cv: { x: 54, y: 300, w: 226, r: -3, z: 8 },
  'job-finite-computer': { x: 446, y: 50, r: 3, z: 5 },
  'job-fedi': { x: 438, y: 126, r: -4, z: 6 },
  'job-zion': { x: 540, y: 132, r: 3, z: 5 },
  'job-blockspaces': { x: 452, y: 206, r: -3, z: 6 },
  'job-ncr': { x: 430, y: 290, r: 4, z: 5 },
  'wins-count': { x: 660, y: 158, w: 170, r: 9, z: 7 },
  'organized-count': { x: 858, y: 146, w: 192, r: -8, z: 6 },
  'latest-win': { x: 800, y: 356, w: 240, r: -4, z: 7 },
  'ncr-win': { x: 662, y: 350, w: 124, r: 8, z: 4 },
  'bolt-top': { x: 372, y: 148, w: 52, r: 14, z: 8 },
  'city-nairobi': { x: 52, y: 388, r: -7, z: 3 },
  'city-taipei': { x: 140, y: 402, r: 5, z: 3 },
  'city-riga': { x: 216, y: 386, r: -6, z: 3 },
  'city-istanbul': { x: 282, y: 404, r: 4, z: 3 },
  'city-florianopolis': { x: 58, y: 430, r: -5, z: 3 },
  'city-berlin': { x: 504, y: 640, r: 6, z: 8 },
  'city-toronto': { x: 590, y: 636, r: -4, z: 8 },
  'city-austin': { x: 192, y: 438, r: 8, z: 3 },
  workshop: { x: 50, y: 480, w: 380, r: -3, z: 5 },
  'last-pay-wins': { x: 444, y: 376, w: 180, r: 6, z: 6 },
  'arion-parking': { x: 640, y: 486, w: 112, r: -7, z: 6 },
  'clawthing-store': { x: 46, y: 604, w: 196, r: 5, z: 7 },
  'pleb-fm': { x: 250, y: 612, w: 232, r: -2, z: 6 },
  'bitcoin-plus-plus': { x: 704, y: 648, w: 126, r: 7, z: 7 },
  'lightning-welder': { x: 862, y: 484, w: 182, r: -6, z: 6 },
  phrase: { x: 256, y: 712, r: -3, z: 8 },
  'next-spot': { x: 496, y: 668, w: 196, r: 3, z: 1 },
  tally: { x: 784, y: 492, w: 44, r: 7, z: 1 },
  'bolt-bottom': { x: 966, y: 700, w: 50, r: -16, z: 8 },
  patents: { x: 492, y: 564, w: 150, r: -2.5, z: 4 },
  elsewhere: { x: 30, y: 788, w: 440, r: -2.5, z: 9 },
  'more-elsewhere': { x: 626, y: 794, w: 440, r: 1.5, z: 8 },
  tilt: { x: 880, y: 712, w: 58, r: -6, z: 8 },
  sound: { x: 690, y: 92, w: 46, r: 8, z: 8 },
  tidy: { x: 672, y: 36, w: 66, r: -5, z: 8 },
}

export const wide = parseLayout('wide', PILE_IDS, ARTBOARDS.wide, placements)
