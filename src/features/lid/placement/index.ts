import { STICKER_IDS } from '../stickers'
import { FRAME } from './artboards'
import { desktop } from './desktop'
import { phone } from './phone'
import { toCss } from './toCss'

/** The stylesheet that puts every sticker in its place on both artboards. */
export function lidPlacementCss(): string {
  return toCss({ order: STICKER_IDS, desktop, phone }, FRAME)
}
