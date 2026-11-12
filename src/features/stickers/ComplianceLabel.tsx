import { Fragment, type ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './ComplianceLabel.module.css'
import metal from './metal.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

/** What sets one number apart from the next where the two share a line. */
const SEPARATOR = '· '
/** How many numbers stand together: a line of the label on a phone, a column of it elsewhere. */
const PER_GROUP = 2

interface ComplianceLabelProps {
  /** What the numbers are, such as "U.S. PATENT FILINGS". */
  readonly heading: string
  readonly numbers: readonly string[]
}

/** The numbers in the order given, a group at a time. The last group may be short. */
function inGroups(numbers: readonly string[]): readonly (readonly string[])[] {
  return Array.from({ length: Math.ceil(numbers.length / PER_GROUP) }, (_, index) =>
    numbers.slice(index * PER_GROUP, (index + 1) * PER_GROUP),
  )
}

/**
 * A metal label of small print: a heading, and under it the numbers. Each run
 * ends in a space, which shows nowhere but keeps the words apart when the
 * label is read out or copied.
 */
export function ComplianceLabel({ heading, numbers }: ComplianceLabelProps): ReactElement {
  return (
    <Vinyl className={cx(metal.brushed, styles.label)}>
      <span className={cx(voice.label, styles.print)}>
        <span className={cx(styles.run, styles.heading)}>{heading} </span>
        {inGroups(numbers).map((group) => (
          <span key={group.join()} className={styles.group}>
            {group.map((number, index) => (
              <Fragment key={number}>
                {index > 0 && <span className={styles.separator}>{SEPARATOR}</span>}
                <span className={styles.run}>{number} </span>
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </Vinyl>
  )
}
