import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Ghost.module.css'
import voice from './voice.module.css'

interface GhostProps {
  /** What the spot is being kept for, in marker. */
  readonly note: string
  /** A line of small print, when there is something to add. */
  readonly detail: string | null
}

/** A dashed outline on the lid where the next sticker will go. */
export function Ghost({ note, detail }: GhostProps): ReactElement {
  return (
    <div className={styles.ghost}>
      <p className={cx(voice.marker, styles.note)}>{note}</p>
      {detail !== null && <p className={styles.detail}>{detail}</p>}
    </div>
  )
}
