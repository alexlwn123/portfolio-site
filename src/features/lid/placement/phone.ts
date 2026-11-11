import { STICKER_IDS, type StickerId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { HIDDEN, parsePhoneLayout, type PhonePlacement } from './schema'

/*
 * The phone arrangement on the 390-wide artboard. It starts from the
 * mockup's and is retuned so that no label falls under 11px on a 360px
 * screen (see design/mockups/DEVIATIONS.md). Only drawings are hidden.
 */
const placements: Record<StickerId, PhonePlacement> = {
  name: { x: 6, y: 22, w: 344, r: -4, z: 6 },
  lanyard: { x: 134, y: 194, w: 260, r: 0, z: 2 },
  badge: { x: 134, y: 194, w: 260, r: 0, z: 9 },
  hello: { x: 8, y: 230, w: 318, r: 2, z: 5 },
  cv: { x: 8, y: 414, w: 218, r: -3, z: 8 },
  'wins-count': { x: -12, y: 498, w: 160, r: -8, z: 7 },
  'organized-count': { x: -18, y: 652, w: 166, r: 7, z: 6 },
  'latest-win': { x: 8, y: 1014, w: 250, r: -3, z: 7 },
  'bolt-top': { x: 322, y: 386, w: 52, r: 14, z: 8 },
  'city-nairobi': { x: 6, y: 838, r: -7, z: 3 },
  'city-taipei': { x: 60, y: 870, r: 5, z: 3 },
  'city-riga': { x: 12, y: 902, r: -6, z: 3 },
  'city-istanbul': { x: 44, y: 934, r: 4, z: 3 },
  'city-florianopolis': { x: 2, y: 968, r: -5, z: 3 },
  'city-berlin': { x: 272, y: 1904, r: 5, z: 8 },
  'city-toronto': { x: 238, y: 1862, r: -6, z: 8 },
  'city-austin': { x: 242, y: 1946, r: -4, z: 8 },
  workshop: { x: 12, y: 1416, w: 360, r: 2, z: 5 },
  'last-pay-wins': { x: 196, y: 1536, w: 192, r: 6, z: 6 },
  'arion-parking': { x: 18, y: 1708, w: 112, r: 6, z: 6 },
  'clawthing-store': { x: -2, y: 1522, w: 194, r: -5, z: 7 },
  'pleb-fm': { x: 142, y: 1738, w: 236, r: 3, z: 6 },
  'bitcoin-plus-plus': { x: 236, y: 1214, w: 138, r: -6, z: 7 },
  'lightning-welder': { x: 2, y: 1172, w: 196, r: 6, z: 6 },
  phrase: { x: 14, y: 1978, r: 4, z: 8 },
  'next-spot': { x: 10, y: 1858, w: 196, r: -4, z: 1 },
  tally: HIDDEN,
  'bolt-bottom': { x: 306, y: 1040, w: 56, r: -16, z: 8 },
  elsewhere: { x: -22, y: 2026, w: 400, r: -2.5, z: 9 },
  'more-elsewhere': { x: 8, y: 2072, w: 400, r: 1.5, z: 8 },
}

export const phone = parsePhoneLayout('phone', STICKER_IDS, ARTBOARDS.phone, placements)
