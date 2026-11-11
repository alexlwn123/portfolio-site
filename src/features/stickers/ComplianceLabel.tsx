import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './ComplianceLabel.module.css'
import metal from './metal.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

/** What sets one number apart from the next. */
const SEPARATOR = ' · '

interface ComplianceLabelProps {
  /** What the numbers are, such as "U.S. PAT. NOS.". */
  readonly heading: string
  readonly numbers: readonly string[]
  /** A closing line about filings still pending, or null when none is. */
  readonly pending: string | null
}

/**
 * A metal label of small print. Each run ends in a space, which shows nowhere
 * but keeps the words apart when the label is read out or copied.
 */
export function ComplianceLabel({ heading, numbers, pending }: ComplianceLabelProps): ReactElement {
  return (
    <Vinyl className={cx(metal.brushed, styles.label)}>
      <span className={cx(voice.label, styles.print)}>
        <span className={styles.statement}>
          <span className={styles.run}>{heading} </span>
          <span className={styles.run}>{numbers.join(SEPARATOR)} </span>
        </span>
        {pending !== null && <span className={styles.run}>{pending}</span>}
      </span>
    </Vinyl>
  )
}
