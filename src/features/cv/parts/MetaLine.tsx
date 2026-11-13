import { Fragment, type ReactElement, type ReactNode } from 'react'

import styles from '../cv.module.css'

const SEPARATOR = ' · '

interface MetaLineProps {
  /** Null and empty parts are dropped, so unknown values leave no trace. */
  readonly parts: readonly ReactNode[]
}

/** A line of short facts joined by dots. Renders nothing when all are unknown. */
export function MetaLine({ parts }: MetaLineProps): ReactElement | null {
  const known = parts.filter((part) => part !== null && part !== undefined && part !== '')
  if (known.length === 0) {
    return null
  }

  return (
    <p className={styles.meta}>
      {known.map((part, index) => (
        // The parts are a fixed, ordered list, so the index is a stable key.
        <Fragment key={index}>
          {index > 0 && SEPARATOR}
          {part}
        </Fragment>
      ))}
    </p>
  )
}
