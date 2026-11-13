/*
 * How wide the label face sets a word. Lettering that runs along a path has
 * to be given its place before any browser has laid it out, so the widths are
 * kept here: the advance of each character of Bricolage Grotesque at 75%
 * width and weight 800, in em, measured in Chromium at optical size 13.5 with
 * kerning off. The label face is always shouted, so only capitals, figures
 * and the marks a label uses are here. e2e/badge.spec.ts checks the table
 * against the browser's own measure of the words on the lanyard.
 */
export const LABEL_ADVANCES: Readonly<Record<string, number>> = Object.freeze({
  A: 0.5058,
  B: 0.5233,
  C: 0.5094,
  D: 0.5331,
  E: 0.4222,
  F: 0.4014,
  G: 0.5262,
  H: 0.5429,
  I: 0.2628,
  J: 0.3397,
  K: 0.5243,
  L: 0.3958,
  M: 0.7469,
  N: 0.589,
  O: 0.5363,
  P: 0.5222,
  Q: 0.5412,
  R: 0.5203,
  S: 0.4896,
  T: 0.4388,
  U: 0.537,
  V: 0.501,
  W: 0.7671,
  X: 0.5366,
  Y: 0.5452,
  Z: 0.4247,
  0: 0.4947,
  1: 0.3029,
  2: 0.4631,
  3: 0.453,
  4: 0.4912,
  5: 0.477,
  6: 0.4941,
  7: 0.3895,
  8: 0.4791,
  9: 0.4939,
  '.': 0.1602,
  ',': 0.1597,
  '-': 0.2474,
  '+': 0.3883,
  '&': 0.6527,
  "'": 0.15,
  '!': 0.242,
  '?': 0.3524,
  '/': 0.2923,
  ':': 0.1799,
  '#': 0.5336,
  '@': 0.8407,
  '(': 0.296,
  ')': 0.3186,
  '·': 0.1602,
  ' ': 0.1854,
})

/** The optical size the table was measured at, and the one lettering set from it must ask for. */
export const LABEL_OPTICAL_SIZE = 13.5

/** A character the table does not have is taken to be as wide as a middling capital. */
export const LABEL_ADVANCE_UNKNOWN = 0.5

/**
 * The length a word takes in the label face: each character's advance and the
 * tracking after it, at a given size. Tracking is in em, as CSS gives it.
 */
export function labelWidth(text: string, size: number, tracking: number): number {
  return Array.from(text.toUpperCase()).reduce<number>(
    (width, character) =>
      width + (LABEL_ADVANCES[character] ?? LABEL_ADVANCE_UNKNOWN) * size + tracking * size,
    0,
  )
}
