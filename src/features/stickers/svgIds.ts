/*
 * Ids inside SVG are global to the page, so every one is namespaced. A
 * definition used by several drawings is made once, in SharedDefs, under an
 * id from SHARED_IDS. A definition inside one sticker's drawing takes that
 * sticker's own id as its prefix.
 */

export const SHARED_IDS = Object.freeze({
  /** The holographic gradient of the die-cut name and the hex badge. */
  foil: 'lid-foil',
  /** The cobalt, bubblegum and highlighter gradient map on the badge photo. */
  tritone: 'lid-tritone',
} as const)

/** An id for a definition that belongs to one sticker. */
export function svgId(owner: string, part: string): string {
  return `${owner}-${part}`
}

/** The value of a fill, stroke or filter attribute that points at an id. */
export function paintRef(id: string): string {
  return `url(#${id})`
}

/** The value of an href attribute that points at an id. */
export function fragment(id: string): string {
  return `#${id}`
}
