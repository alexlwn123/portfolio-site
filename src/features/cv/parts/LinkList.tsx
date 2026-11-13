import { Fragment, type ReactElement } from 'react'

import type { Link } from '../../../content'
import { linkTo } from '../../../lib/linkTo'
import styles from '../cv.module.css'

const SEPARATOR = ' · '

interface LinkListProps {
  readonly links: readonly Link[]
  /** What the links belong to. Read out with each label, so "Code" is never ambiguous. */
  readonly context: string
}

/** A record's links on one line. Renders nothing when there are none. */
export function LinkList({ links, context }: LinkListProps): ReactElement | null {
  if (links.length === 0) {
    return null
  }

  return (
    <p className={styles.links}>
      {links.map((link, index) => (
        <Fragment key={link.url}>
          {index > 0 && SEPARATOR}
          <a {...linkTo(link.url)}>
            {link.label}
            <span className={styles.visuallyHidden}>: {context}</span>
          </a>
        </Fragment>
      ))}
    </p>
  )
}
