import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import paint from './paint.module.css'
import styles from './ParkingSign.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface ParkingSignProps {
  /** The sign's letter. Decoration: the name underneath says what it is. */
  readonly letter: string
  readonly name: string
}

export function ParkingSign({ letter, name }: ParkingSignProps): ReactElement {
  return (
    <Vinyl className={styles.sign}>
      <span className={styles.plate} aria-hidden="true">
        <span className={cx(voice.display, styles.letter)}>{letter}</span>
        <svg className={styles.bolt} viewBox="0 0 60 90" focusable="false">
          <path
            className={cx(paint.hi, paint.inkLine)}
            d="M38 4L8 50h20l-8 36 34-50H33z"
            strokeWidth="5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={cx(voice.label, styles.name)}>{name}</span>
    </Vinyl>
  )
}
