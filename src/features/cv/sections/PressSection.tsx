import type { ReactElement } from 'react'

import type { Content, Press } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import styles from '../cv.module.css'
import { LABELS } from '../labels'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

type Sources = Pick<Content, 'organized' | 'wins'>

interface PressEntryProps {
  readonly item: Press
  readonly sources: Sources
}

function PressEntry({ item, sources }: PressEntryProps): ReactElement {
  // The claim is derived from the record, so it cannot say more than is true.
  const { claim, naming } = pressClaim(item, sources)
  const hasHeadline = item.title !== null

  return (
    <Entry when={null}>
      <p className={styles.entryTitle}>
        {item.outlet}
        {item.programme !== null && `, ${item.programme}`}
      </p>
      <p>
        <a href={item.url}>{item.title ?? claim}</a>
      </p>
      <MetaLine
        parts={[
          item.reporter !== null ? `${LABELS.reportedBy} ${item.reporter}` : null,
          item.date !== null ? <DateText date={item.date} month="long" /> : null,
        ]}
      />
      {hasHeadline && <p>{claim}</p>}
      {naming !== null && <p className={styles.note}>{naming}</p>}
    </Entry>
  )
}

interface PressSectionProps {
  readonly press: readonly Press[]
  readonly sources: Sources
}

export function PressSection({ press, sources }: PressSectionProps): ReactElement {
  return (
    <Section id="press">
      <ul className={styles.list}>
        {press.map((item) => (
          <PressEntry key={item.id} item={item} sources={sources} />
        ))}
      </ul>
    </Section>
  )
}
