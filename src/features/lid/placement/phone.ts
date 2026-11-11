import { PILE_IDS, type PileId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { HIDDEN, parsePhoneLayout, type PhonePlacement } from './schema'

/*
 * The pile on a phone, on the 390-wide artboard, with the column from x=16
 * to x=374. It keeps the order the wider two have, one thing under the next:
 * the heading, the plain CV, the employers two abreast, the counts, the wins,
 * the projects, the cities and the links. Only drawings are hidden. No label
 * falls under 11px on a 360px screen (see design/mockups/DEVIATIONS.md).
 */
const placements: Record<PileId, PhonePlacement> = {
  'pile-title': { x: 16, y: 44, r: -2.5, z: 5 },
  'pile-kicker': { x: 22, y: 178, w: 340, r: -1.5, z: 2 },
  cv: { x: 16, y: 262, w: 218, r: -3, z: 8 },
  'job-finite-computer': { x: 18, y: 346, r: -3, z: 5 },
  'job-fedi': { x: 142, y: 352, r: 4, z: 6 },
  'job-zion': { x: 252, y: 358, r: -3, z: 5 },
  'job-blockspaces': { x: 44, y: 446, r: 3, z: 6 },
  'job-ncr': { x: 200, y: 440, r: -3, z: 5 },
  'wins-count': { x: 18, y: 542, w: 160, r: -8, z: 7 },
  'organized-count': { x: 204, y: 534, w: 166, r: 7, z: 6 },
  'latest-win': { x: 16, y: 720, w: 250, r: -3, z: 7 },
  'ncr-win': { x: 228, y: 884, w: 140, r: 7, z: 6 },
  'bolt-top': { x: 322, y: 62, w: 48, r: 14, z: 8 },
  'city-nairobi': { x: 24, y: 1750, r: -7, z: 3 },
  'city-taipei': { x: 112, y: 1764, r: 5, z: 3 },
  'city-riga': { x: 188, y: 1748, r: -6, z: 3 },
  'city-istanbul': { x: 254, y: 1766, r: 4, z: 3 },
  'city-florianopolis': { x: 30, y: 1792, r: -5, z: 3 },
  'city-berlin': { x: 212, y: 1890, r: 5, z: 8 },
  'city-toronto': { x: 150, y: 1838, r: -6, z: 8 },
  'city-austin': { x: 164, y: 1800, r: -4, z: 3 },
  workshop: { x: 16, y: 1112, w: 358, r: 2, z: 5 },
  'last-pay-wins': { x: 180, y: 1236, w: 192, r: 6, z: 6 },
  'arion-parking': { x: 244, y: 1462, w: 112, r: 6, z: 6 },
  'clawthing-store': { x: 16, y: 1446, w: 194, r: -5, z: 7 },
  'pleb-fm': { x: 68, y: 1636, w: 236, r: 3, z: 6 },
  'bitcoin-plus-plus': { x: 20, y: 1262, w: 138, r: -6, z: 7 },
  'lightning-welder': { x: 18, y: 866, w: 196, r: 6, z: 6 },
  phrase: { x: 24, y: 1962, r: 4, z: 8 },
  'next-spot': { x: 18, y: 1854, w: 196, r: -4, z: 1 },
  tally: HIDDEN,
  'bolt-bottom': { x: 296, y: 756, w: 52, r: -16, z: 8 },
  patents: { x: 64, y: 2020, w: 262, r: 1.5, z: 8 },
  elsewhere: { x: -4, y: 2086, w: 384, r: -2.5, z: 9 },
  'more-elsewhere': { x: 6, y: 2142, w: 384, r: 1.5, z: 8 },
  tilt: { x: 300, y: 268, w: 54, r: 6, z: 8 },
  sound: { x: 324, y: 1842, w: 46, r: -8, z: 8 },
  tidy: { x: 304, y: 1902, w: 66, r: -4, z: 8 },
}

export const phone = parsePhoneLayout('phone', PILE_IDS, ARTBOARDS.phone, placements)
