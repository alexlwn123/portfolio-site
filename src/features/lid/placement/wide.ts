import { STICKER_IDS, type StickerId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { parseLayout, type Placement } from './schema'

/*
 * The laptop's arrangement, hand-set on the 1100-wide artboard: x, y and
 * width in design units, tilt in degrees, and the layer each sticker sits on.
 */
const placements: Record<StickerId, Placement> = {
  name: { x: 18, y: 14, w: 460, r: -4, z: 6 },
  lanyard: { x: 770, y: -110, w: 260, r: 0, z: 2 },
  badge: { x: 770, y: -110, w: 260, r: 0, z: 9 },
  hello: { x: 22, y: 300, w: 430, r: 1.5, z: 5 },
  cv: { x: 28, y: 506, w: 226, r: -3, z: 8 },
  'job-finite-computer': { x: 492, y: 22, r: 3, z: 5 },
  'job-fedi': { x: 500, y: 96, r: -4, z: 6 },
  'job-zion': { x: 604, y: 106, r: 3, z: 5 },
  'job-blockspaces': { x: 520, y: 178, r: -3, z: 6 },
  'job-ncr': { x: 482, y: 262, r: 4, z: 5 },
  'wins-count': { x: 478, y: 336, w: 164, r: 9, z: 7 },
  'organized-count': { x: 500, y: 472, w: 184, r: -8, z: 6 },
  'latest-win': { x: 266, y: 512, w: 240, r: -4, z: 7 },
  'ncr-win': { x: 972, y: 10, w: 124, r: 8, z: 4 },
  'bolt-top': { x: 440, y: 280, w: 52, r: 14, z: 8 },
  'city-nairobi': { x: 22, y: 588, r: -7, z: 3 },
  'city-taipei': { x: 110, y: 606, r: 5, z: 3 },
  'city-riga': { x: 188, y: 590, r: -6, z: 3 },
  'city-istanbul': { x: 160, y: 640, r: 4, z: 3 },
  'city-florianopolis': { x: 30, y: 634, r: -5, z: 3 },
  'city-berlin': { x: 640, y: 902, r: 6, z: 8 },
  'city-toronto': { x: 740, y: 900, r: -4, z: 8 },
  'city-austin': { x: 1008, y: 910, r: 8, z: 8 },
  workshop: { x: 20, y: 688, w: 380, r: -3, z: 5 },
  'last-pay-wins': { x: 398, y: 664, w: 180, r: 6, z: 6 },
  'arion-parking': { x: 580, y: 712, w: 112, r: -7, z: 6 },
  'clawthing-store': { x: 6, y: 812, w: 196, r: 5, z: 7 },
  'pleb-fm': { x: 208, y: 866, w: 232, r: -2, z: 6 },
  'bitcoin-plus-plus': { x: 870, y: 904, w: 126, r: 7, z: 7 },
  'lightning-welder': { x: 446, y: 846, w: 182, r: -6, z: 6 },
  phrase: { x: 214, y: 960, r: -3, z: 8 },
  'next-spot': { x: 640, y: 930, w: 196, r: 3, z: 1 },
  tally: { x: 646, y: 336, w: 44, r: 7, z: 1 },
  'bolt-bottom': { x: 1020, y: 955, w: 50, r: -16, z: 8 },
  patents: { x: 214, y: 806, w: 150, r: -2.5, z: 4 },
  elsewhere: { x: -26, y: 1034, w: 440, r: -2.5, z: 9 },
  'more-elsewhere': { x: 668, y: 1040, w: 440, r: 1.5, z: 8 },
  tilt: { x: 722, y: 20, w: 58, r: -6, z: 8 },
  sound: { x: 728, y: 92, w: 46, r: 8, z: 8 },
  tidy: { x: 630, y: 656, w: 66, r: -5, z: 8 },
}

export const wide = parseLayout('wide', STICKER_IDS, ARTBOARDS.wide, placements)
