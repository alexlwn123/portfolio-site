import type { ReactElement } from 'react'

import { copy } from '../../content/copy'
import { PATHS } from '../../lib/paths'
import styles from './ComingSoon.module.css'

/** Holds the home page until the lid is built. */
export function ComingSoon(): ReactElement {
  const { title, body, cvLink } = copy.placeholder

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.body}>{body}</p>
      <p>
        <a className={styles.link} href={PATHS.cv}>
          {cvLink}
        </a>
      </p>
    </main>
  )
}
