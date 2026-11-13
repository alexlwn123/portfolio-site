import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Jukebox.module.css'
import { Lines } from './Lines'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface JukeboxProps {
  readonly name: string
  /** What it is and what it won, one item to a line. */
  readonly lines: readonly string[]
}

const BARS = ['first', 'second', 'third', 'fourth', 'fifth'] as const

export function Jukebox({ name, lines }: JukeboxProps): ReactElement {
  return (
    <Vinyl className={styles.case} tone="ink">
      <span className={styles.equaliser} aria-hidden="true">
        {BARS.map((bar) => (
          <span key={bar} className={styles.bar} />
        ))}
      </span>
      <span>
        <span className={cx(voice.display, styles.name)}>{name} </span>
        <span className={styles.detail}>
          <Lines lines={lines} />
        </span>
      </span>
    </Vinyl>
  )
}
