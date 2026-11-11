import type { ReactElement } from 'react'

import type { Profile } from '../../content'
import { PATHS } from '../../lib/paths'
import styles from './cv.module.css'
import { displayUrl, placeLine, roleLine } from './describe'
import { LABELS, SECTIONS } from './labels'

interface CvHeaderProps {
  readonly profile: Profile
}

/** Who he is, how to reach him, and the way to each section. */
export function CvHeader({ profile }: CvHeaderProps): ReactElement {
  return (
    <header className={styles.header}>
      <p className={styles.back} data-print="hide">
        <a href={PATHS.home}>{LABELS.home}</a>
      </p>
      <h1 className={styles.name}>{profile.name}</h1>
      <p className={styles.role}>{roleLine(profile)}</p>
      <p className={styles.place}>{placeLine(profile)}</p>
      <p className={styles.reach}>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        {' · '}
        <a href={profile.site}>{displayUrl(profile.site)}</a>
      </p>
      <p className={styles.field}>{profile.field}</p>
      <p className={styles.words}>{profile.selfDescription.join(' ')}</p>
      <nav aria-label={LABELS.sectionsNav} className={styles.nav} data-print="hide">
        <ul>
          {SECTIONS.map(({ id, title }) => (
            <li key={id}>
              <a href={`#${id}`}>{title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
