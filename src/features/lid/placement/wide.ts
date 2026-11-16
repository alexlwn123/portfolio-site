import { PILE_IDS, type PileId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { parseLayout, type Placement } from './schema'

/*
 * The pile on a laptop, hand-set on the 1100-wide artboard: x, y and width in
 * design units, tilt in degrees, and the layer each sticker sits on. Its main
 * mass sits in the column, from x=50 to x=1050, as an even scatter that is
 * loosely sorted: where he has worked is one heap at the top, with the plain CV
 * and the patents just under it; the cities he has run hackathons in are a
 * heap around the count of them; the wins sit with the winner's count, and the
 * projects are spread across the lower half. Big and small alternate across
 * every stretch of it. Read from the top it still goes in order: the heading
 * on the left edge, as every section's is, then where he has worked and the
 * two counts, then the wins and the projects, and last the links.
 */
const placements: Record<PileId, Placement> = {
  'pile-title': { x: 50, y: 60, r: -2.5, z: 5 },
  'pile-kicker': { x: 58, y: 212, w: 360, r: -1.5, z: 2 },
  cv: { x: 260, y: 280, w: 226, r: -3, z: 8 },
  'job-finite-computer': { x: 486, y: 34, r: 3, z: 5 },
  'job-fedi': { x: 378, y: 34, r: -6, z: 6 },
  'job-zion': { x: 535, y: 130, r: 4, z: 5 },
  'job-blockspaces': { x: 387, y: 114, r: -3, z: 6 },
  'job-ncr': { x: 476, y: 196, r: 2, z: 5 },
  'wins-count': { x: 70, y: 292, w: 170, r: 9, z: 7 },
  'organized-count': { x: 858, y: 130, w: 192, r: -8, z: 6 },
  'latest-win': { x: 425, y: 340, w: 240, r: -4, z: 7 },
  'ncr-win': { x: 265, y: 376, w: 124, r: 8, z: 4 },
  'bolt-top': { x: 675, y: 366, w: 44, r: 10, z: 8 },
  'city-nairobi': { x: 764, y: 244, r: -5, z: 3 },
  'city-taipei': { x: 748, y: 370, r: -6, z: 3 },
  'city-riga': { x: 826, y: 384, r: 6, z: 3 },
  'city-istanbul': { x: 905, y: 386, r: -4, z: 3 },
  'city-florianopolis': { x: 704, y: 306, r: 3, z: 3 },
  'city-berlin': { x: 748, y: 176, r: 5, z: 3 },
  'city-toronto': { x: 872, y: 345, r: 4, z: 3 },
  'city-austin': { x: 968, y: 336, r: -6, z: 3 },
  workshop: { x: 50, y: 524, w: 380, r: -3, z: 5 },
  'last-pay-wins': { x: 429, y: 485, w: 180, r: 6, z: 6 },
  'arion-parking': { x: 697, y: 645, w: 112, r: -6, z: 6 },
  'clawthing-store': { x: 667, y: 450, w: 196, r: 4, z: 7 },
  'pleb-fm': { x: 50, y: 665, w: 232, r: -2, z: 6 },
  'bitcoin-plus-plus': { x: 870, y: 431, w: 126, r: 7, z: 7 },
  'lightning-welder': { x: 868, y: 569, w: 182, r: -5, z: 6 },
  phrase: { x: 278, y: 700, r: -3, z: 8 },
  'next-spot': { x: 496, y: 685, w: 196, r: 3, z: 1 },
  tally: { x: 1005, y: 401, w: 44, r: 7, z: 1 },
  'bolt-bottom': { x: 618, y: 599, w: 50, r: -16, z: 8 },
  patents: { x: 526, y: 273, w: 150, r: -2.5, z: 4 },
  elsewhere: { x: 30, y: 790, w: 440, r: -2.5, z: 9 },
  'more-elsewhere': { x: 626, y: 796, w: 440, r: 1.5, z: 8 },
  tilt: { x: 816, y: 715, w: 58, r: -6, z: 8 },
  sound: { x: 714, y: 36, w: 46, r: 8, z: 8 },
}

export const wide = parseLayout('wide', PILE_IDS, ARTBOARDS.wide, placements)
