import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import voice from '../../../stickers/voice.module.css'
import styles from './mat.module.css'

interface MatPropProps {
  /** What is scribbled on the mat beside it. */
  readonly note: string
  /** Where it lies. */
  readonly className?: string | undefined
}

/** The knurled grip, the collar that holds the blade, and the blade. */
function WorkingEnd(): ReactElement {
  return (
    <>
      <path className={cx(styles.blade, paint.inkLine)} d="M22 66V30L38 4V66Z" strokeWidth="2.5" />
      <rect
        className={cx(styles.steel, paint.inkLine)}
        x="18"
        y="64"
        width="24"
        height="24"
        rx="3"
        strokeWidth="2.5"
      />
      <rect
        className={cx(styles.steel, paint.inkLine)}
        x="15"
        y="88"
        width="30"
        height="62"
        rx="5"
        strokeWidth="2.5"
      />
      <path
        className={cx(paint.hollow, paint.inkLine, styles.faint)}
        d="M15 100h30M15 112h30M15 124h30M15 136h30M18 72h24M18 80h24"
        strokeWidth="2"
      />
    </>
  )
}

/**
 * The craft knife the stickers were cut with, left lying on the mat. A list
 * item, so that it can lie in a gap among the stickers; furniture all the
 * same, and hidden from a screen reader.
 */
export function CraftKnife({ note, className }: MatPropProps): ReactElement {
  return (
    <li className={cx(styles.prop, className)} aria-hidden="true" data-mat-prop="knife">
      <svg className={styles.knife} viewBox="0 0 60 330" focusable="false">
        <WorkingEnd />
        <rect
          className={cx(paint.gum, paint.inkLine)}
          x="18"
          y="148"
          width="24"
          height="160"
          rx="10"
          strokeWidth="2.5"
        />
        <path className={styles.gleam} d="M25 160v130" strokeWidth="4" strokeLinecap="round" />
        <rect className={paint.ink} x="21" y="304" width="18" height="18" rx="6" />
      </svg>
      <span className={cx(voice.marker, styles.note)}>{note}</span>
    </li>
  )
}
