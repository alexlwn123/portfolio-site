import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Cue.module.css'
import { ArrowDown, ArrowRight } from './illustrations/Glyphs'
import voice from './voice.module.css'

interface CueProps {
  readonly text: string
  /**
   * True for the cover's second line: a way straight to one section, written
   * smaller and in white, so that it never competes with the cue to scroll.
   */
  readonly quiet?: boolean
}

/**
 * A way on from the cover, written on the lid in his marker, with an arrow
 * drawn after it. The cue to scroll is loud and its arrow points down. The
 * quiet one points on.
 */
export function Cue({ text, quiet = false }: CueProps): ReactElement {
  const Arrow = quiet ? ArrowRight : ArrowDown

  return (
    <span className={cx(voice.marker, styles.cue, quiet && styles.quiet)}>
      {text}
      <Arrow className={styles.arrow} />
    </span>
  )
}
