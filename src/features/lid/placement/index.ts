import { COVER_IDS, PILE_IDS } from '../stickers'
import { FRAME } from './artboards'
import { covers } from './cover'
import { coverCss } from './coverCss'
import { desktop } from './desktop'
import { phone } from './phone'
import { wideSpread } from './spread'
import { toCss } from './toCss'
import { wide } from './wide'

/** The stylesheet that puts every sticker in its place: the pile's three artboards, then the cover's four compositions. */
export function lidPlacementCss(): string {
  return [
    toCss({ order: PILE_IDS, wide, spread: wideSpread, desktop, phone }, FRAME),
    coverCss({ order: COVER_IDS, layouts: covers }, FRAME),
  ].join('')
}
