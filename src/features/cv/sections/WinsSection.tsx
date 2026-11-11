import type { ReactElement } from 'react'

import type { Stats, Win } from '../../../content'
import styles from '../cv.module.css'
import { resultLabel, winsSummary } from '../describe'
import { DateSpanText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

function WinEntry({ win }: { readonly win: Win }): ReactElement {
  const year = String(win.year)

  return (
    <Entry when={<time dateTime={year}>{year}</time>}>
      <p className={styles.entryTitle}>
        <span className={styles.result}>{resultLabel(win.result)}</span> {win.project}
      </p>
      <MetaLine
        parts={[
          win.event,
          win.eventDate !== null ? <DateSpanText span={win.eventDate} /> : null,
          win.eventPlace,
        ]}
      />
      {win.description !== null && <p>{win.description}</p>}
      {win.notes.length > 0 && <p className={styles.note}>{win.notes.join(' ')}</p>}
    </Entry>
  )
}

interface WinsSectionProps {
  readonly wins: readonly Win[]
  readonly stats: Stats['wins']
}

export function WinsSection({ wins, stats }: WinsSectionProps): ReactElement {
  return (
    <Section id="wins">
      <p className={styles.summary}>{winsSummary(stats)}</p>
      <ul className={styles.entries}>
        {wins.map((win) => (
          <WinEntry key={win.id} win={win} />
        ))}
      </ul>
    </Section>
  )
}
