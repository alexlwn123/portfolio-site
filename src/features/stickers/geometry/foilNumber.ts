/*
 * The big die-cut number, in the units of its drawing. Two digits are the
 * "16" of the approved wristbands mockup: 270 units by 196, lettered at 200
 * on a baseline 164 down. Each digit more or fewer is 135 units of width.
 */
export const FOIL_NUMBER = Object.freeze({
  /** The room one digit takes, its share of the die-cut edge included. */
  digit: 135,
  height: 196,
  baseline: 164,
  size: 200,
  /** The digits are set this much closer than the typeface sets them. */
  tracking: -6,
})

export interface FoilNumberBox {
  readonly width: number
  readonly height: number
  /** The x the figure is centred on. */
  readonly centre: number
}

/** The drawing that holds a figure of this many characters. */
export function foilNumberBox(figure: string): FoilNumberBox {
  const width = Math.max(1, figure.length) * FOIL_NUMBER.digit
  return { width, height: FOIL_NUMBER.height, centre: width / 2 }
}
