import { STICKER_IDS, type StickerId } from '../stickers'
import { ARTBOARDS } from './artboards'
import { HIDDEN, parsePhoneLayout, type PhonePlacement } from './schema'

/*
 * The phone arrangement on the 390-wide artboard. It starts from the
 * mockup's and is retuned so that no label falls under 11px on a 360px
 * screen (see design/mockups/DEVIATIONS.md). Only drawings are hidden.
 *
 * The additions made room for themselves: everything from the foil win down
 * moved 46 to 60 units lower to clear the fifth ribbon and let the medal sit
 * beside the foil win, and the compliance label has a row of its own above
 * the wristbands.
 *
 * The three buttons sit where the lid was bare: "tilt me" in the top corner,
 * where a phone's owner will see it first, and the other two either side of
 * the gap between the ribbons and the foil win.
 */
const placements: Record<StickerId, PhonePlacement> = {
  name: { x: 6, y: 22, w: 344, r: -4, z: 6 },
  lanyard: { x: 134, y: 234, w: 260, r: 0, z: 2 },
  badge: { x: 134, y: 234, w: 260, r: 0, z: 9 },
  hello: { x: 8, y: 230, w: 374, r: 1.2, z: 5 },
  cv: { x: 8, y: 462, w: 218, r: -3, z: 8 },
  'job-finite-computer': { x: 4, y: 540, r: -3, z: 5 },
  'job-fedi': { x: 14, y: 636, r: 4, z: 6 },
  'job-zion': { x: 2, y: 720, r: -3, z: 5 },
  'job-blockspaces': { x: -4, y: 788, r: 3, z: 6 },
  'job-ncr': { x: 4, y: 872, r: -3, z: 5 },
  'wins-count': { x: 4, y: 1150, w: 160, r: -8, z: 7 },
  'organized-count': { x: 196, y: 1132, w: 166, r: 7, z: 6 },
  'latest-win': { x: 8, y: 1330, w: 250, r: -3, z: 7 },
  'ncr-win': { x: 244, y: 1376, w: 140, r: 7, z: 6 },
  'bolt-top': { x: 322, y: 436, w: 52, r: 14, z: 8 },
  'city-nairobi': { x: 8, y: 968, r: -7, z: 3 },
  'city-taipei': { x: 40, y: 1002, r: 5, z: 3 },
  'city-riga': { x: 10, y: 1036, r: -6, z: 3 },
  'city-istanbul': { x: 26, y: 1070, r: 4, z: 3 },
  'city-florianopolis': { x: 2, y: 1106, r: -5, z: 3 },
  'city-berlin': { x: 272, y: 2234, r: 5, z: 8 },
  'city-toronto': { x: 238, y: 2192, r: -6, z: 8 },
  'city-austin': { x: 242, y: 2276, r: -4, z: 8 },
  workshop: { x: 12, y: 1746, w: 360, r: 2, z: 5 },
  'last-pay-wins': { x: 196, y: 1866, w: 192, r: 6, z: 6 },
  'arion-parking': { x: 18, y: 2038, w: 112, r: 6, z: 6 },
  'clawthing-store': { x: -2, y: 1852, w: 194, r: -5, z: 7 },
  'pleb-fm': { x: 142, y: 2068, w: 236, r: 3, z: 6 },
  'bitcoin-plus-plus': { x: 236, y: 1544, w: 138, r: -6, z: 7 },
  'lightning-welder': { x: 2, y: 1502, w: 196, r: 6, z: 6 },
  phrase: { x: 14, y: 2308, r: 4, z: 8 },
  'next-spot': { x: 10, y: 2188, w: 196, r: -4, z: 1 },
  tally: HIDDEN,
  'bolt-bottom': { x: 194, y: 1460, w: 52, r: -16, z: 8 },
  patents: { x: 64, y: 2364, w: 262, r: 1.5, z: 8 },
  elsewhere: { x: -22, y: 2424, w: 400, r: -2.5, z: 9 },
  'more-elsewhere': { x: 8, y: 2470, w: 400, r: 1.5, z: 8 },
  tilt: { x: 330, y: 3, w: 54, r: 6, z: 8 },
  sound: { x: 336, y: 1310, w: 46, r: -8, z: 8 },
  tidy: { x: 268, y: 1316, w: 66, r: -4, z: 8 },
}

export const phone = parsePhoneLayout('phone', STICKER_IDS, ARTBOARDS.phone, placements)
