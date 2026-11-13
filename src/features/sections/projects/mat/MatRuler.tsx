import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import voice from '../../../stickers/voice.module.css'
import styles from './MatRuler.module.css'

/** How many heavy lines the ruler numbers. More than any screen is wide or any section tall. */
export const RULER_MARKS = 36

const MARKS = Array.from({ length: RULER_MARKS }, (_, index) => String(index))

interface MatRulerProps {
  /** Which edge of the mat the scale runs along. */
  readonly edge: 'left' | 'top'
}

/**
 * The scale printed along an edge of a cutting mat. It counts the mat's own
 * heavy lines, from the corner. Furniture: it says nothing a reader needs, and
 * it must be a direct child of the section's body so that it can reach the
 * section's edge.
 */
export function MatRuler({ edge }: MatRulerProps): ReactElement {
  return (
    <div
      className={cx(voice.label, styles.ruler, styles[edge])}
      aria-hidden="true"
      data-mat-prop="ruler"
      data-edge={edge}
    >
      {MARKS.map((mark) => (
        <span key={mark} className={styles.mark} data-mark="">
          {mark}
        </span>
      ))}
    </div>
  )
}
