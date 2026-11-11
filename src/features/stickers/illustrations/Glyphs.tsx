import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import styles from './glyphs.module.css'

interface GlyphProps {
  readonly className?: string | undefined
}

/** A four-pointed star with hollowed sides, for the gaps between words. */
export const STAR_PATH = 'M0-6Q.9-.9 6 0Q.9.9 0 6Q-.9.9-6 0Q-.9-.9 0-6Z'

export function Star({ className }: GlyphProps): ReactElement {
  return (
    <svg
      className={cx(styles.glyph, className)}
      viewBox="-6 -6 12 12"
      aria-hidden="true"
      focusable="false"
    >
      <path d={STAR_PATH} />
    </svg>
  )
}

export function ArrowRight({ className }: GlyphProps): ReactElement {
  return (
    <svg
      className={cx(styles.glyph, styles.stroked, className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 12h17M13 5l7 7-7 7" strokeWidth="3.2" />
    </svg>
  )
}

/** Drawn with a marker, a little off the vertical. */
export function ArrowDown({ className }: GlyphProps): ReactElement {
  return (
    <svg
      className={cx(styles.glyph, styles.stroked, className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.5 3q-1.5 8-.5 17M5.5 13.5l6.5 6.5 6-7" strokeWidth="2.8" />
    </svg>
  )
}
