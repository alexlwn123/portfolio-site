import type { ReactElement, ReactNode } from 'react'

import type { Education } from '../../../content'
import styles from '../cv.module.css'
import { LABELS } from '../labels'
import { DateSpanText, DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { Section } from '../parts/Section'

/** The years he was there, or only when it began. Nothing when the start is unknown. */
function attended({ start, end }: Education): ReactNode {
  if (start === null) {
    return null
  }
  if (end !== null) {
    return <DateSpanText span={{ start, end }} month="long" />
  }
  return (
    <>
      {LABELS.began} <DateText date={start} month="long" />
    </>
  )
}

function EducationEntry({ entry }: { readonly entry: Education }): ReactElement {
  return (
    <Entry when={attended(entry)}>
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
