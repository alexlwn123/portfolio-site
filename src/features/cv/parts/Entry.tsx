import type { ReactElement, ReactNode } from 'react'

import styles from '../cv.module.css'

interface EntryProps {
  /** What goes in the date column. Null leaves the column empty. */
  readonly when: ReactNode
  readonly children: ReactNode
}

/** One record in a section's list: a date column and a body. */
export function Entry({ when, children }: EntryProps): ReactElement {
  return (
    <li className={styles.entry}>
      {when !== null && <div className={styles.when}>{when}</div>}
      <div className={styles.body}>{children}</div>
    </li>
  )
}
