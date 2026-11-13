import type { ReactElement } from 'react'

import type { Stats, Win } from '../../../content'
import styles from '../cv.module.css'
import {
  eventLabel,
  fieldLabel,
  firstWeekNote,
  placeLabel,
  resultLabel,
  teammatesLine,
  winsSummary,
  winTitle,
} from '../describe'
import { LABELS } from '../labels'
import { DateSpanText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { LinkList } from '../parts/LinkList'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

/** The facts printed in small type under a win, as one line. Null when there are none. */
function notesLine(win: Win): string | null {
  const notes = [
    ...(win.firstWeekSats !== null ? [firstWeekNote(win.firstWeekSats)] : []),
    ...win.notes,
  ]
  return notes.length > 0 ? notes.join(' ') : null
}

function WinEntry({ win }: { readonly win: Win }): ReactElement {
  const year = String(win.year)
  const title = winTitle(win)
  const teammates = teammatesLine(win)
  const notes = notesLine(win)

  return (
    <Entry when={<time dateTime={year}>{year}</time>}>
      <p className={styles.entryTitle}>
        <span className={styles.result}>{resultLabel(win.result)}</span> {title}
      </p>
      <MetaLine
        parts={[
          eventLabel(win),
          win.eventDate !== null ? <DateSpanText span={win.eventDate} /> : null,
          win.eventPlace !== null ? placeLabel(win.eventPlace) : null,
          win.field !== null ? fieldLabel(win.field) : null,
        ]}
      />
      {win.description !== null && <p>{win.description}</p>}
      {win.announcedAs !== null && (
        <p className={styles.note}>
          {LABELS.announcedAs} “{win.announcedAs}”
        </p>
      )}
      {teammates !== null && <p className={styles.note}>{teammates}</p>}
      {notes !== null && <p className={styles.note}>{notes}</p>}
      <LinkList links={win.links} context={title} />
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
