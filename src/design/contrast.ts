const HEX_COLOUR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i
const CHANNEL_MAX = 255

// Constants from the WCAG 2 definition of relative luminance.
const LINEAR_THRESHOLD = 0.04045
const LINEAR_DIVISOR = 12.92
const GAMMA_OFFSET = 0.055
const GAMMA_DIVISOR = 1.055
const GAMMA = 2.4
const RED_WEIGHT = 0.2126
const GREEN_WEIGHT = 0.7152
const BLUE_WEIGHT = 0.0722
const FLARE = 0.05

function linearChannel(hexPair: string): number {
  const value = Number.parseInt(hexPair, 16) / CHANNEL_MAX
  return value <= LINEAR_THRESHOLD
    ? value / LINEAR_DIVISOR
    : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA
}

/** WCAG relative luminance of a six-digit hex colour: 0 for black, 1 for white. */
export function relativeLuminance(hex: string): number {
  const match = HEX_COLOUR.exec(hex.trim())
  if (!match) {
    throw new Error(`Expected a six-digit hex colour such as #2B35F5, received "${hex}"`)
  }
  const [, red = '', green = '', blue = ''] = match
  return (
    RED_WEIGHT * linearChannel(red) +
    GREEN_WEIGHT * linearChannel(green) +
    BLUE_WEIGHT * linearChannel(blue)
  )
}

/** WCAG contrast ratio between two colours, from 1 (identical) to 21. */
export function contrastRatio(first: string, second: string): number {
  const luminances = [relativeLuminance(first), relativeLuminance(second)]
  const lighter = Math.max(...luminances)
  const darker = Math.min(...luminances)
  return (lighter + FLARE) / (darker + FLARE)
}
