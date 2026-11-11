import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './FoilWin.module.css'
import { Lines } from './Lines'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface FoilWinProps {
  /** The place taken, such as "1st". */
  readonly rank: string
  /** The project that won. */
  readonly title: string
  /** Where and when, one item to a line. */
  readonly lines: readonly string[]
}

export function FoilWin({ rank, title, lines }: FoilWinProps): ReactElement {
  return (
    <Vinyl className={styles.win} foil peel="bottomRight">
      <span className={cx(voice.display, styles.rank)}>{rank}</span>{' '}
      <span>
        <span className={cx(voice.label, styles.title)}>{title} </span>
        <span className={styles.detail}>
          <Lines lines={lines} />
        </span>
      </span>
    </Vinyl>
  )
}
