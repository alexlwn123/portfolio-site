import type { ReactElement } from 'react'

import styles from './Lines.module.css'

interface LinesProps {
  /** One item to a line. Empty items are left out. */
  readonly lines: readonly string[]
}

/**
 * Text set on separate lines without a line-break element. Each line ends in
 * a space, which shows nowhere but keeps the words apart when the text is
 * read out or copied.
 */
export function Lines({ lines }: LinesProps): ReactElement {
  return (
    <>
      {lines
        .filter((line) => line !== '')
        .map((line) => (
          <span key={line} className={styles.line}>
            {line}{' '}
          </span>
        ))}
    </>
  )
}
