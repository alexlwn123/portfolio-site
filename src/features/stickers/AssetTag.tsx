import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './AssetTag.module.css'
import { ArrowRight } from './illustrations/Glyphs'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface AssetTagProps {
  /** The small line over the label. */
  readonly kicker: string
  readonly label: string
}

/** A metal asset tag that points somewhere: a small line, a label and an arrow. */
export function AssetTag({ kicker, label }: AssetTagProps): ReactElement {
  return (
    <Vinyl className={styles.tag}>
      <span className={styles.bars} aria-hidden="true" />
      <span>
        <span className={cx(voice.label, styles.kicker)}>{kicker}</span>
        <span className={styles.label}>
          {label} <ArrowRight className={styles.arrow} />
        </span>
      </span>
    </Vinyl>
  )
}
