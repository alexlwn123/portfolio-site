import type { ReactElement } from 'react'

import type { Education } from '../../../content'
import styles from '../cv.module.css'
import { LABELS } from '../labels'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { Section } from '../parts/Section'

function EducationEntry({ entry }: { readonly entry: Education }): ReactElement {
  const began =
    entry.start !== null ? (
      <>
        {LABELS.began} <DateText date={entry.start} month="long" />
      </>
    ) : null

  return (
    <Entry when={began}>
      <p className={styles.entryTitle}>{entry.institution}</p>
      <p className={styles.org}>
        {entry.level}, {entry.subject}
      </p>
      {entry.graduated !== null && (
        <p className={styles.meta}>
          {LABELS.graduated} <DateText date={entry.graduated} month="long" />
        </p>
      )}
    </Entry>
  )
}

interface EducationSectionProps {
  readonly education: readonly Education[]
}

export function EducationSection({ education }: EducationSectionProps): ReactElement {
  return (
    <Section id="education">
      <ul className={styles.entries}>
        {education.map((entry) => (
          <EducationEntry key={entry.id} entry={entry} />
        ))}
      </ul>
    </Section>
  )
}
