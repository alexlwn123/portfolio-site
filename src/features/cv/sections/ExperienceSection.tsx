import type { ReactElement, ReactNode } from 'react'

import type { Experience } from '../../../content'
import styles from '../cv.module.css'
import { experienceWhen } from '../describe'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { Section } from '../parts/Section'

function roleWhen(role: Experience): ReactNode {
  const when = experienceWhen(role)
  if (when === null) {
    return null
  }
  return (
    <>
      {when.label}
      {when.date !== null && (
        <>
          {' '}
          <DateText date={when.date} month="long" />
        </>
      )}
    </>
  )
}

function Role({ role }: { readonly role: Experience }): ReactElement {
  return (
    <Entry when={roleWhen(role)}>
      <p className={styles.entryTitle}>{role.title}</p>
      <p className={styles.org}>
        {role.organization}
        {role.team !== null && `, ${role.team}`}
      </p>
      {role.description !== null && <p>{role.description}</p>}
    </Entry>
  )
}

interface ExperienceSectionProps {
  readonly experience: readonly Experience[]
}

export function ExperienceSection({ experience }: ExperienceSectionProps): ReactElement {
  return (
    <Section id="experience">
      <ul className={styles.entries}>
        {experience.map((role) => (
          <Role key={role.id} role={role} />
        ))}
      </ul>
    </Section>
  )
}
