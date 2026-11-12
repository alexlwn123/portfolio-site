import { Fragment, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../../lib/classNames'
import { formatDateSpan, isoDate } from '../../../lib/formatDate'
import { ArrowUpRight } from './ArrowUpRight'
import voice from '../../stickers/voice.module.css'
import { organizedCopy } from './copy'
import type { Chip, EventLabel, PressLine } from './eventLabels'
import styles from './EventNote.module.css'

interface EventNoteProps {
  readonly label: EventLabel
}

const SEPARATOR = ' · '

/** When it was and where, as far as the record goes, joined by dots. */
function When({ label }: EventNoteProps): ReactElement | null {
  const { date, where, upcoming } = label
  const parts: readonly ReactNode[] = [
    upcoming ? organizedCopy.upcoming : null,
    date === null ? null : <time dateTime={isoDate(date.start)}>{formatDateSpan(date)}</time>,
    where,
  ].filter((part) => part !== null)
  if (parts.length === 0) {
    return null
  }

  return (
    <p className={styles.when}>
      {parts.map((part, index) => (
        // The parts are a fixed, ordered list, so the index is a stable key.
        <Fragment key={index}>
          {index > 0 && SEPARATOR}
          {part}
        </Fragment>
      ))}
    </p>
  )
}

function Chips({ chips }: { readonly chips: readonly Chip[] }): ReactElement | null {
  if (chips.length === 0) {
    return null
  }

  return (
    <ul className={styles.chips} role="list">
      {chips.map(({ kind, text }) => (
        <li key={text} className={cx(voice.label, styles.chip, styles[kind])} data-chip={kind}>
          {text}
        </li>
      ))}
    </ul>
  )
}

/** The press piece: a link named by the claim. */
function PressItem({ label, href, claim }: PressLine): ReactElement {
  return (
    <p className={styles.press}>
      <a
        className={cx(voice.label, styles.chip, styles.pressLink)}
        href={href}
        aria-label={organizedCopy.linkName(label, claim)}
      >
        {label}
        <ArrowUpRight className={styles.arrow} />
      </a>
    </p>
  )
}

/**
 * What is lettered on the lid beside a wristband: the city in his hand, when
 * and where, the figures the organizers published, and a scrawl where there
 * is a story.
 */
export function EventNote({ label }: EventNoteProps): ReactElement {
  const { place, about, chips, press, scrawl } = label

  return (
    <div className={styles.note}>
      {place !== null && <p className={cx(voice.marker, styles.city)}>{place}</p>}
      <When label={label} />
      {about.map((line) => (
        <p key={line} className={styles.about}>
          {line}
        </p>
      ))}
      <Chips chips={chips} />
      {press.map((item) => (
        <PressItem key={item.href} {...item} />
      ))}
      {scrawl !== null && <p className={cx(voice.marker, styles.scrawl)}>{scrawl}</p>}
    </div>
  )
}
