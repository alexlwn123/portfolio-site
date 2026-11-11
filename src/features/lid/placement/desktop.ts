import { PILE_IDS, type PileId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { parseLayout, type Placement } from './schema'

/*
 * The pile on a tablet, hand-set on the 728-wide artboard: x, y and width in
 * design units, tilt in degrees, and the layer each sticker sits on. The
 * column runs from x=30 to x=698. It is the arrangement the first mockup
 * approved (design/mockups/01-first-screen.html), with the name, the hello
 * tag and the badge gone to the cover, a heading where they were, and the
 * room the badge's ribbons took given to the employers and the counts.
 */
const placements: Record<PileId, Placement> = {
  'pile-title': { x: 30, y: 56, r: -2.5, z: 5 },
  'pile-kicker': { x: 38, y: 222, w: 370, r: -1.5, z: 2 },
  cv: { x: 32, y: 300, w: 226, r: -3, z: 8 },
  'job-finite-computer': { x: 412, y: 204, r: 3, z: 5 },
  'job-fedi': { x: 404, y: 280, r: -4, z: 6 },
  'job-zion': { x: 506, y: 286, r: 3, z: 5 },
  'job-blockspaces': { x: 420, y: 360, r: -3, z: 6 },
  'job-ncr': { x: 396, y: 444, r: 4, z: 5 },
  'wins-count': { x: 34, y: 392, w: 190, r: 9, z: 7 },
  'organized-count': { x: 232, y: 522, w: 212, r: -8, z: 6 },
  'latest-win': { x: 448, y: 530, w: 248, r: -4, z: 7 },
  'ncr-win': { x: 244, y: 392, w: 112, r: -7, z: 4 },
  'bolt-top': { x: 346, y: 150, w: 52, r: 14, z: 8 },
  'city-nairobi': { x: 34, y: 600, r: -7, z: 3 },
  'city-taipei': { x: 122, y: 614, r: 5, z: 3 },
  'city-riga': { x: 40, y: 640, r: -6, z: 3 },
  'city-istanbul': { x: 108, y: 656, r: 4, z: 3 },
  'city-florianopolis': { x: 34, y: 690, r: -5, z: 3 },
  'city-berlin': { x: 268, y: 1058, r: 6, z: 8 },
  'city-toronto': { x: 356, y: 1050, r: -4, z: 8 },
  'city-austin': { x: 150, y: 704, r: 8, z: 3 },
  workshop: { x: 30, y: 758, w: 380, r: -3, z: 5 },
  'last-pay-wins': { x: 446, y: 672, w: 190, r: 6, z: 6 },
  'arion-parking': { x: 598, y: 1086, w: 112, r: -7, z: 6 },
  'clawthing-store': { x: 30, y: 886, w: 210, r: 5, z: 7 },
  'pleb-fm': { x: 254, y: 892, w: 232, r: -2, z: 6 },
  'bitcoin-plus-plus': { x: 452, y: 1082, w: 126, r: 7, z: 7 },
  'lightning-welder': { x: 522, y: 884, w: 156, r: -6, z: 6 },
  phrase: { x: 30, y: 1084, r: -4, z: 8 },
  'next-spot': { x: 260, y: 1072, w: 196, r: 3, z: 1 },
  tally: { x: 646, y: 250, w: 46, r: 7, z: 1 },
  'bolt-bottom': { x: 644, y: 780, w: 50, r: -16, z: 8 },
  patents: { x: 264, y: 990, w: 150, r: -2.5, z: 4 },
  elsewhere: { x: -10, y: 1222, w: 372, r: -2.5, z: 9 },
  'more-elsewhere': { x: 372, y: 1234, w: 384, r: 1.5, z: 8 },
  tilt: { x: 176, y: 1134, w: 58, r: -6, z: 8 },
  sound: { x: 352, y: 304, w: 46, r: 8, z: 8 },
  tidy: { x: 274, y: 310, w: 66, r: -5, z: 8 },
}

export const desktop = parseLayout('desktop', PILE_IDS, ARTBOARDS.desktop, placements)
