import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import paint from '../paint.module.css'
import styles from './controls.module.css'

/**
 * A round speaker. Its button says whether sound is on: the waves are drawn
 * while it is, and a cross while it is not. A drawing: the caller names it.
 */
export function SoundFace(): ReactElement {
  return (
    <svg className={paint.art} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle className={paint.white} cx="50" cy="50" r="48" />
      <circle className={paint.ink} cx="50" cy="50" r="41" />
      <path className={paint.hi} d="M24 41h11l15-13v44L35 59H24z" />
      <g className={cx(paint.hollow, styles.stroke, styles.waves)}>
        <path d="M60 39q8 11 0 22" />
        <path d="M68 30q15 20 0 40" />
      </g>
      <path
        className={cx(paint.hollow, styles.stroke, styles.cross)}
        d="M60 40l17 20M77 40L60 60"
      />
    </svg>
  )
}
