import type { ReactElement } from 'react'

import { copy } from '../../content/copy'
import { PATHS } from '../../lib/paths'
import styles from './NotFound.module.css'

/** The 404 page: says what happened and offers the two ways on. */
export function NotFound(): ReactElement {
  const { title, body, homeLink, cvLink } = copy.notFound

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p>{body}</p>
      <ul className={styles.links}>
        <li>
          <a href={PATHS.home}>{homeLink}</a>
        </li>
        <li>
          <a href={PATHS.cv}>{cvLink}</a>
        </li>
      </ul>
    </main>
  )
}
