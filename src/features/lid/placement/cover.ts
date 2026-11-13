import { COVER_IDS, type CoverId } from '../stickers'
import { columnWidth, type CoverName, COVERS } from './artboards'
import { type CoverLayout, type CoverPlacement, parseCoverLayout } from './schema'

/*
 * The cover's four compositions, hand-set. Across, a placement is measured in
 * from one edge of the page's column; down, from the top of the screen, its
 * middle or its bottom (see schema.ts). The lanyard and the badge share a
 * place, so that they swing as one.
 *
 * On a laptop and on a tablet on its side, the name owns the left of the
 * column and the badge hangs from the top edge on the right. The name and the
 * hello tag are set about the middle of the screen, so a taller screen puts
 * the bare lid above and below them. On a phone and on an upright tablet the
 * screen is taller than it is wide: the name runs across the top, the hello
 * tag sits under it, and the badge hangs lower, with its ribbons trailing off
 * the bottom of the screen.
 *
 * The way to the contact section is written under the hello tag's left end
 * and is measured from the same line of the screen, so the two stay together
 * on a screen of any height. It has no width: it is one line, as long as its
 * words.
 */

const HANG_WIDTH = 260
/** The card is narrower than the box it hangs in: this puts its edge on the column's. */
const HANG_INSET = -12

function hang(y: number): Pick<CoverPlacement, 'from' | 'against' | 'x' | 'y' | 'w' | 'r'> {
  return { from: 'right', against: 'top', x: HANG_INSET, y, w: HANG_WIDTH, r: 0 }
}

const wide: Record<CoverId, CoverPlacement> = {
  name: { from: 'left', against: 'middle', x: 4, y: -246, w: 590, r: -4, z: 6 },
  lanyard: { ...hang(-150), z: 2 },
  badge: { ...hang(-150), z: 9 },
  hello: { from: 'left', against: 'middle', x: 8, y: 128, w: 460, r: 1.5, z: 5 },
  contact: { from: 'left', against: 'middle', x: 16, y: 262, r: -2, z: 4 },
  cue: { from: 'right', against: 'bottom', x: 276, y: 34, w: 176, r: -3, z: 4 },
}

const landscape: Record<CoverId, CoverPlacement> = {
  name: { from: 'left', against: 'middle', x: -4, y: -204, w: 376, r: -4, z: 6 },
  lanyard: { ...hang(-196), z: 2 },
  badge: { ...hang(-196), z: 9 },
  hello: { from: 'left', against: 'middle', x: 2, y: 34, w: 372, r: 1.5, z: 5 },
  contact: { from: 'left', against: 'middle', x: 10, y: 190, r: -2, z: 4 },
  cue: { from: 'left', against: 'bottom', x: 8, y: 16, w: 300, r: -2, z: 4 },
}

const portrait: Record<CoverId, CoverPlacement> = {
  name: { from: 'left', against: 'top', x: -6, y: 40, w: 610, r: -4, z: 6 },
  lanyard: { ...hang(170), z: 2 },
  badge: { ...hang(170), z: 9 },
  hello: { from: 'left', against: 'top', x: 2, y: 436, w: 400, r: 1.5, z: 5 },
  contact: { from: 'left', against: 'top', x: 10, y: 596, r: -2, z: 4 },
  cue: { from: 'left', against: 'bottom', x: 10, y: 60, w: 300, r: -3, z: 4 },
}

const phone: Record<CoverId, CoverPlacement> = {
  name: { from: 'left', against: 'top', x: -6, y: 12, w: 370, r: -4, z: 6 },
  lanyard: { ...hang(100), z: 2 },
  badge: { ...hang(100), z: 9 },
  hello: { from: 'left', against: 'top', x: 0, y: 232, w: 358, r: 1.2, z: 5 },
  contact: { from: 'left', against: 'top', x: 2, y: 384, r: -2, z: 4 },
  cue: { from: 'left', against: 'bottom', x: 2, y: 26, w: 100, r: -4, z: 4 },
}

const raw: Record<CoverName, Record<CoverId, CoverPlacement>> = { wide, landscape, portrait, phone }

function parse(name: CoverName): CoverLayout<CoverId> {
  const { board, height } = COVERS[name]
  return parseCoverLayout(
    `cover.${name}`,
    COVER_IDS,
    { width: columnWidth(board), height },
    raw[name],
  )
}

export const covers: Readonly<Record<CoverName, CoverLayout<CoverId>>> = Object.freeze({
  wide: parse('wide'),
  landscape: parse('landscape'),
  portrait: parse('portrait'),
  phone: parse('phone'),
})
