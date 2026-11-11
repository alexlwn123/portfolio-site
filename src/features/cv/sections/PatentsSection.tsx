import type { ReactElement } from 'react'

import type { Patent, Stats } from '../../../content'
import { publishablePatents } from '../../../content/derive'
import styles from '../cv.module.css'
import { coInventorsLabel, patentNumber, patentsSummary } from '../describe'
import { APPLICATION_STATES, LABELS } from '../labels'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { LinkList } from '../parts/LinkList'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

const APPLICATIONS_HEADING_ID = 'patents-applications'

type Granted = Patent & { readonly status: Extract<Patent['status'], { kind: 'granted' }> }
type Application = Patent & { readonly status: Exclude<Patent['status'], { kind: 'granted' }> }

function isGranted(patent: Patent): patent is Granted {
  return patent.status.kind === 'granted'
}

function isApplication(patent: Patent): patent is Application {
  return patent.status.kind !== 'granted'
}

function GrantedEntry({ patent }: { readonly patent: Granted }): ReactElement {
  const granted = (
    <>
      {LABELS.granted} <DateText date={patent.status.granted} />
    </>
  )

  return (
    <Entry when={granted}>
      <p className={styles.entryTitle}>{patent.title}</p>
      <MetaLine
        parts={[patentNumber(patent.number), patent.assignee, coInventorsLabel(patent.coInventors)]}
      />
      <LinkList links={[patent.link]} context={patent.title} />
    </Entry>
  )
}

/** An application is labelled as one, with its state, so it is never read as a patent. */
function ApplicationEntry({ patent }: { readonly patent: Application }): ReactElement {
  const filed =
    patent.filed !== null ? (
      <>
        {LABELS.filed} <DateText date={patent.filed} />
      </>
    ) : null

  return (
    <Entry when={filed}>
      <p className={styles.entryTitle}>{patent.title}</p>
      <MetaLine
        parts={[
          `${LABELS.application} ${patentNumber(patent.number)}`,
          APPLICATION_STATES[patent.status.kind],
          patent.assignee,
          coInventorsLabel(patent.coInventors),
        ]}
      />
      <LinkList links={[patent.link]} context={patent.title} />
    </Entry>
  )
}

function Applications({
  applications,
}: {
  readonly applications: readonly Application[]
}): ReactElement | null {
  if (applications.length === 0) {
    return null
  }

  return (
    <>
      <h3 id={APPLICATIONS_HEADING_ID} className={styles.subheading}>
        {LABELS.applications}
      </h3>
      <ul aria-labelledby={APPLICATIONS_HEADING_ID} className={styles.entries}>
        {applications.map((patent) => (
          <ApplicationEntry key={patent.id} patent={patent} />
        ))}
      </ul>
    </>
  )
}

interface PatentsSectionProps {
  readonly patents: readonly Patent[]
  readonly stats: Stats['patents']
}

/** Granted patents first, then applications. Filings he has not chosen to show are left out. */
export function PatentsSection({ patents, stats }: PatentsSectionProps): ReactElement {
  const shown = publishablePatents(patents)
  const granted = shown.filter(isGranted)
  const summary = patentsSummary(stats)

  return (
    <Section id="patents">
      {summary !== null && <p className={styles.summary}>{summary}</p>}
      {granted.length > 0 && (
        <ul aria-label={LABELS.grantedList} className={styles.entries}>
          {granted.map((patent) => (
            <GrantedEntry key={patent.id} patent={patent} />
          ))}
        </ul>
      )}
      <Applications applications={shown.filter(isApplication)} />
    </Section>
  )
}
