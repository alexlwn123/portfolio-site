import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { formatPartialDate, isoDate } from '../../../lib/formatDate'
import { patentNumber } from '../../cv/describe'
import { Lines } from '../../stickers/Lines'
import metal from '../../stickers/metal.module.css'
import voice from '../../stickers/voice.module.css'
import { sectionAnchor } from '../sectionIds'
import { Stuck } from '../Stuck'
import { type Counted, workCopy } from './copy'
import { filedOutcome, organizedLine, plural, winLine } from './describe'
import { markSection, type PathMark } from './path'
import styles from './PathMarks.module.css'

type MarkOf<Kind extends PathMark['kind']> = Extract<PathMark, { readonly kind: Kind }>

interface TallyProps {
  readonly count: number
  readonly words: Counted
  /** What the count is of, line by line. */
  readonly children: ReactElement | readonly ReactElement[]
}

/** How many, in the display face, then of what, and the lines that say which. */
function Tally({ count, words, children }: TallyProps): ReactElement {
  return (
    <>
      <span className={cx(voice.display, styles.figure)} data-figure="">
        {count}
      </span>{' '}
      <span className={styles.text}>
        <span className={cx(voice.label, styles.unit)}>{plural(count, words)}</span>{' '}
        <span className={styles.lines}>{children}</span>
      </span>
    </>
  )
}

function WinsFace({ wins }: MarkOf<'wins'>): ReactElement {
  return (
    <span className={cx(styles.face, styles.wins)}>
      <Tally count={wins.length} words={workCopy.marks.wins}>
        {wins.map((win) => {
          const { name, detail } = winLine(win)
          return (
            <span key={win.id} className={styles.line}>
              <span className={styles.name}>{name}</span> <span>{detail}</span>{' '}
            </span>
          )
        })}
      </Tally>
    </span>
  )
}

function OrganizedFace({ events }: MarkOf<'organized'>): ReactElement {
  return (
    <span className={cx(styles.face, styles.organized)}>
      <Tally count={events.length} words={workCopy.marks.organized}>
        <span className={styles.line}>{organizedLine(events)}</span>
      </Tally>
    </span>
  )
}

function GrantedFace({ patents }: MarkOf<'granted'>): ReactElement {
  return (
    <span className={cx(metal.brushed, styles.face, styles.granted)}>
      <Tally count={patents.length} words={workCopy.marks.granted}>
        {patents.map((patent) => (
          <span key={patent.id} className={styles.line}>
            <span className={styles.name}>{patentNumber(patent.number)}</span>{' '}
            <time dateTime={isoDate(patent.status.granted)}>
              {formatPartialDate(patent.status.granted)}
            </time>{' '}
          </span>
        ))}
      </Tally>
    </span>
  )
}

function FiledFace({ patents }: MarkOf<'filed'>): ReactElement {
  return (
    <span className={cx(styles.face, styles.filed)}>
      <Tally count={patents.length} words={workCopy.marks.filed}>
        {patents.map((patent) => (
          <span key={patent.id} className={styles.line}>
            <time className={styles.name} dateTime={isoDate(patent.filed)}>
              {formatPartialDate(patent.filed)}
            </time>
            : {filedOutcome(patent)}{' '}
          </span>
        ))}
      </Tally>
    </span>
  )
}

function FirstTalkFace({ talk, date }: MarkOf<'firstTalk'>): ReactElement {
  return (
    <span className={cx(styles.face, styles.firstTalk)}>
      <span className={cx(voice.label, styles.kicker)}>
        <Lines lines={workCopy.marks.firstTalk} />
      </span>
      <span className={styles.lines}>
        <span className={cx(styles.line, styles.name)}>{talk.title} </span>
        <span className={styles.line}>
          {talk.venue !== null && <>{talk.venue.name} · </>}
          <time dateTime={isoDate(date)}>{formatPartialDate(date)}</time>
        </span>
      </span>
    </span>
  )
}

function MarkFace({ mark }: { readonly mark: PathMark }): ReactElement {
  switch (mark.kind) {
    case 'wins':
      return <WinsFace {...mark} />
    case 'organized':
      return <OrganizedFace {...mark} />
    case 'granted':
      return <GrantedFace {...mark} />
    case 'filed':
      return <FiledFace {...mark} />
    case 'firstTalk':
      return <FirstTalkFace {...mark} />
  }
}

interface PathMarksProps {
  readonly marks: readonly PathMark[]
  readonly year: number
}

/**
 * The small stickers on the other side of the rule: what else happened in a
 * year. Each is a link to the section that tells the rest.
 */
export function PathMarks({ marks, year }: PathMarksProps): ReactElement | null {
  if (marks.length === 0) {
    return null
  }

  return (
    <ul className={styles.marks} role="list" aria-label={workCopy.marks.also(year)} data-marks="">
      {marks.map((mark) => (
        <li key={mark.kind} className={styles.item} data-mark={mark.kind}>
          <Stuck href={sectionAnchor(markSection(mark.kind))}>
            <MarkFace mark={mark} />
          </Stuck>
        </li>
      ))}
    </ul>
  )
}
