import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Lines } from '../stickers/Lines'
import { Vinyl } from '../stickers/Vinyl'
import voice from '../stickers/voice.module.css'
import styles from './HeadingLabel.module.css'

interface HeadingLabelProps {
  /** The heading, shouted over two lines. An empty line is left out. */
  readonly lines: readonly [string, string]
}

/**
 * The face of a heading sticker: highlighter vinyl with the title shouted on
 * it. Every section's heading is one, and so is the heading of the pile on
 * the lid, so the page reads as a run of bands titled the same way.
 */
export function HeadingLabel({ lines }: HeadingLabelProps): ReactElement {
  return (
    <Vinyl tone="hi" className={styles.label}>
      <span className={cx(voice.display, styles.words)}>
        <Lines lines={lines} />
      </span>
    </Vinyl>
  )
}
