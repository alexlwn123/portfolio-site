import { CONTROL_IDS, STICKER_IDS } from '../stickers'
import { FRAME } from './artboards'
import { desktop } from './desktop'
import { phone } from './phone'
import { toCss } from './toCss'
import { wide } from './wide'

/** The stylesheet that puts every sticker in its place on all three artboards. */
export function lidPlacementCss(): string {
  return toCss({ order: STICKER_IDS, wide, desktop, phone, late: CONTROL_IDS }, FRAME)
}
