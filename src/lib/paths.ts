/** Site paths. The build uses trailing slashes, so links must match. */
export const PATHS = Object.freeze({
  home: '/',
  cv: '/cv/',
} as const)

export type PathKey = keyof typeof PATHS
