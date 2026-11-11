/*
 * How the name is lettered. Each letter of the die-cut name is its own piece,
 * so that the letters can be stuck down one at a time, and a piece has to be
 * given its place before any browser has laid it out. So the widths are kept
 * here: the advance of each capital of Bricolage Grotesque at weight 400 and
 * full width, in em, measured in Chromium at optical size 96 with kerning
 * off. The name is always shouted, so only capitals and the marks a name may
 * carry are here. e2e/lid.spec.ts checks the table against the browser's own
 * measure of the letters on the page.
 */
export const NAME_ADVANCES: Readonly<Record<string, number>> = Object.freeze({
  A: 0.6084,
  B: 0.5813,
  C: 0.623,
  D: 0.611,
  E: 0.5273,
  F: 0.506,
  G: 0.6436,
  H: 0.621,
  I: 0.197,
  J: 0.2997,
  K: 0.5843,
  L: 0.4467,
  M: 0.7707,
  N: 0.654,
  O: 0.6557,
  P: 0.5593,
  Q: 0.655,
  R: 0.583,
  S: 0.569,
  T: 0.4994,
  U: 0.6177,
  V: 0.5973,
  W: 0.8904,
  X: 0.5644,
  Y: 0.543,
  Z: 0.5287,
  '-': 0.2957,
  "'": 0.1401,
  '.': 0.1554,
  ' ': 0.25,
})

/**
 * The optical size the table was measured at, and the one the lettering asks
 * for. It is the largest the face has: what a browser picks by itself for
 * letters this big, pinned so that every browser picks the same.
 */
export const NAME_OPTICAL_SIZE = 96

/** A character the table does not have is taken to be as wide as a middling capital. */
export const NAME_ADVANCE_UNKNOWN = 0.58

/** One letter of a line: what it is, where it starts and how wide the face draws it. */
export interface SetLetter {
  /** The letter as it was written. The stylesheet shouts it. */
  readonly letter: string
  readonly x: number
  readonly advance: number
}

const X_DECIMALS = 3
const HALF = 0.5

function rounded(value: number): number {
  return Number(value.toFixed(X_DECIMALS))
}

function advanceOf(character: string, size: number): number {
  return (NAME_ADVANCES[character.toUpperCase()] ?? NAME_ADVANCE_UNKNOWN) * size
}

/**
 * Sets a line of the name across a measure, as a justified line is set: the
 * first letter starts where the line starts, the last ends where it ends, and
 * what is left over is shared out evenly between them. A single letter sits
 * in the middle. A space takes its room and is not a letter.
 */
export function setLine(
  text: string,
  size: number,
  from: number,
  measure: number,
): readonly SetLetter[] {
  const characters = Array.from(text)
  const advances = characters.map((character) => advanceOf(character, size))
  const natural = advances.reduce((sum, advance) => sum + advance, 0)
  const spare = measure - natural
  const gaps = characters.length - 1
  const between = gaps > 0 ? spare / gaps : 0
  const start = gaps > 0 ? from : from + spare * HALF

  return characters.flatMap((letter, index) => {
    const before = advances.slice(0, index).reduce((sum, advance) => sum + advance, 0)
    const set = {
      letter,
      x: rounded(start + before + between * index),
      advance: rounded(advances[index] ?? 0),
    }
    return letter.trim() === '' ? [] : [set]
  })
}

/** The drawing the name is lettered on, in its own units. */
export const NAME_VIEW = Object.freeze({ width: 480, height: 298 })

/** The measure both lines are set across: where a line starts, and how long it is. */
export const NAME_MEASURE = Object.freeze({ from: 27, width: 426 })

/** The two lines: the size each is lettered at, and the baseline it stands on. */
export const NAME_LINES = Object.freeze([
  Object.freeze({ size: 174, baseline: 142 }),
  Object.freeze({ size: 131, baseline: 264 }),
] as const)

/** The band of light that crosses the foil once: where it starts, off the left of the drawing, and its size. */
export const NAME_LIGHT = Object.freeze({ x: -150, y: -30, width: 120, height: 360 })

/**
 * Letters past this many share the last turn, so a long name still goes on
 * in under a second. The stylesheet has a delay for each turn up to it.
 */
export const NAME_LAST_TURN = 15
