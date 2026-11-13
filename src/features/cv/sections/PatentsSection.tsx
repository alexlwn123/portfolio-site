import type { ReactElement } from 'react'

import type { Patent, Stats } from '../../../content'
import { publishablePatents } from '../../../content/derive'
import styles from '../cv.module.css'
import { patentNumber, patentsSummary } from '../describe'
import { LABELS } from '../labels'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { LinkList } from '../parts/LinkList'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

/** One filing: when it was filed, its title, its number and its public record. */
function FilingEntry({ patent }: { readonly patent: Patent }): ReactElement {
  const filed =
    patent.filed !== null ? (
      <>
        {LABELS.filed} <DateText date={patent.filed} />
      </>
    ) : null

  return (
    <Entry when={filed}>
      <p className={styles.entryTitle}>{patent.title}</p>
      <MetaLine parts={[patentNumber(patent.number)]} />
      <LinkList links={[patent.link]} context={patent.title} />
    </Entry>
  )
}

interface PatentsSectionProps {
  readonly patents: readonly Patent[]
  readonly stats: Stats['patents']
}

/**
 * Every filing that names him as an inventor, in one list and printed the
 * same way. A filing he has taken off the site is left out.
 */
export function PatentsSection({ patents, stats }: PatentsSectionProps): ReactElement {
  const shown = publishablePatents(patents)
  const summary = patentsSummary(stats)

  return (
    <Section id="patents">
      {summary !== null && <p className={styles.summary}>{summary}</p>}
      {shown.length > 0 && (
        <ul className={styles.entries}>
          {shown.map((patent) => (
            <FilingEntry key={patent.id} patent={patent} />
          ))}
        </ul>
      )}
    </Section>
  )
}
