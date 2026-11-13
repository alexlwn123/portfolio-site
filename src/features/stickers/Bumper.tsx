import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Bumper.module.css'
import { Lines } from './Lines'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface BumperProps {
  /** The slogan, over two lines. An empty line is left out. */
  readonly lines: readonly [string, string]
  readonly note: string
}

export function Bumper({ lines, note }: BumperProps): ReactElement {
  return (
    <Vinyl className={styles.bumper} tone="hi" peel="topLeft">
      <span className={cx(voice.display, styles.title)}>
        <Lines lines={lines} />
      </span>
      <span className={styles.note}>{note}</span>
    </Vinyl>
  )
}
