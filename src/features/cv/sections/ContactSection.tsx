import type { ReactElement } from 'react'

import type { Profile } from '../../../content'
import styles from '../cv.module.css'
import { displayUrl } from '../describe'
import { LABELS } from '../labels'
import { Section } from '../parts/Section'

interface ContactSectionProps {
  readonly profile: Profile
}

export function ContactSection({ profile }: ContactSectionProps): ReactElement {
  return (
    <Section id="contact">
      <ul className={styles.contact}>
        <li>
          <span className={styles.term}>{LABELS.email}</span>{' '}
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <span className={styles.term}>{LABELS.site}</span>{' '}
          <a href={profile.site}>{displayUrl(profile.site)}</a>
        </li>
        {profile.links.map((link) => (
          <li key={link.id}>
            <a href={link.url}>{link.label}</a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
