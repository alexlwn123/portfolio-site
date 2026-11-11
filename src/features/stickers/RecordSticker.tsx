import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Lines } from './Lines'
import styles from './RecordSticker.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface RecordStickerProps {
  /** The big mark, such as "++". Decoration: the first line names it. */
  readonly mark: string
  /** A name and its figures, one item to a line. */
  readonly lines: readonly string[]
}

export function RecordSticker({ mark, lines }: RecordStickerProps): ReactElement {
  return (
    <Vinyl className={styles.record} tone="tang">
      <span className={cx(voice.display, styles.mark)} aria-hidden="true">
        {mark}
      </span>
      <span className={cx(voice.label, styles.detail)}>
        <Lines lines={lines} />
      </span>
    </Vinyl>
  )
}
