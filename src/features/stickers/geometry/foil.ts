/*
 * Where the light sits on the holographic foil. It rests where the mockup
 * started it: Lid.module.css carries the same two numbers as the lamp's
 * resting place, which the CSS foil follows. An SVG gradient cannot read a
 * custom property, so these functions place the SVG foil to match: at build
 * time for the lamp at rest, and from the page's script when the lamp moves.
 */

export interface FoilLight {
  /** 0 at the left edge of the lid, 1 at the right. */
  readonly x: number
  /** 0 at the top edge of the lid, 1 at the bottom. */
  readonly y: number
}

export const FOIL_REST: FoilLight = Object.freeze({ x: 0.35, y: 0.3 })

const SLIDE = { span: 260, origin: 130 } as const
const TURN = { span: 40, origin: 20, aboutX: 240, aboutY: 140 } as const
const DECIMALS = 1

function fixed(value: number): string {
  return String(Number(value.toFixed(DECIMALS)))
}

/** The gradientTransform of the shared foil gradient for a light position. */
export function foilGradientTransform({ x, y }: FoilLight): string {
  const slide = fixed(x * SLIDE.span - SLIDE.origin)
  const turn = fixed(y * TURN.span - TURN.origin)
  return `translate(${slide} 0) rotate(${turn} ${String(TURN.aboutX)} ${String(TURN.aboutY)})`
}

/** The centre of the hot spot on a drawing of the given size. */
export function foilGlowCentre(
  { x, y }: FoilLight,
  drawing: { readonly width: number; readonly height: number },
): { readonly cx: string; readonly cy: string } {
  return { cx: fixed(x * drawing.width), cy: fixed(y * drawing.height) }
}

/** The die-cut name's drawing. Its hot spot is placed across 480 by 300 units. */
export const NAME_GLOW_FIELD = Object.freeze({ width: 480, height: 300 })
