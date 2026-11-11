/*
 * Who lands when. Things that come into view together are stuck down one
 * after another, in the order the eye reads them, so that neighbours never
 * land on the same frame. Nothing here touches the page: arriveDom.ts watches
 * it, asks this for the turns, and draws them.
 */

/** Something that has just come into view, and where on the screen it is. */
export interface Arrived<Item> {
  readonly item: Item
  readonly left: number
  readonly top: number
}

/** How long after now a thing lands. */
export interface Turn<Item> {
  readonly item: Item
  readonly delayMs: number
}

export interface Pace {
  /** The time between one landing and the next. */
  readonly gapMs: number
  /** Nothing waits longer than this: a crowd is squeezed in to fit. */
  readonly longestWaitMs: number
  /** Things whose tops are within this of each other are read as one row. */
  readonly rowPx: number
}

export interface Turns<Item> {
  readonly turns: readonly Turn<Item>[]
  /** When the last of them has had its gap: the next batch waits for this. */
  readonly freeAtMs: number
}

/** The order the eye reads them in: a row at a time, left to right along it. */
function asRead<Item>(batch: readonly Arrived<Item>[], rowPx: number): readonly Arrived<Item>[] {
  const row = ({ top }: Arrived<Item>): number => Math.floor(top / Math.max(rowPx, 1))
  return batch.toSorted((one, other) => row(one) - row(other) || one.left - other.left)
}

/**
 * Gives each of a batch its turn. The first lands as soon as whatever was
 * still landing is done, and each of the rest a gap after the one before. If
 * that would keep the last one waiting too long, the gaps are drawn in until
 * it does not.
 */
export function takeTurns<Item>(
  batch: readonly Arrived<Item>[],
  nowMs: number,
  freeAtMs: number,
  { gapMs, longestWaitMs, rowPx }: Pace,
): Turns<Item> {
  if (batch.length === 0) {
    return { turns: [], freeAtMs }
  }
  const first = Math.min(Math.max(freeAtMs - nowMs, 0), longestWaitMs)
  const steps = batch.length - 1
  const gap = steps > 0 ? Math.min(gapMs, (longestWaitMs - first) / steps) : 0
  const turns = asRead(batch, rowPx).map(({ item }, index) => ({
    item,
    delayMs: Math.round(first + gap * index),
  }))
  const last = turns.at(-1)?.delayMs ?? 0

  return { turns, freeAtMs: nowMs + last + gapMs }
}
