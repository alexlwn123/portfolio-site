import type { ReactElement } from 'react'

import type { Profile } from '../../../content'
import { cx } from '../../../lib/classNames'
import voice from '../../stickers/voice.module.css'
import styles from './CareerPath.module.css'
import { workCopy } from './copy'
import { barcodeText } from './describe'
import { JobTag } from './JobTag'
import type { PathStop } from './path'
import { type MarksLayout, PathMarks } from './PathMarks'
import { PathTotals } from './PathTotals'
import { PermitTag } from './PermitTag'
import { hangsPast, isQuiet } from './room'
import type { PathTotal } from './totals'

type Owner = Pick<Profile, 'givenName' | 'familyName'>

/** How far down a tag reaches, by the number of stops it hangs past. */
const REACH: readonly (string | undefined)[] = [undefined, styles.past1, styles.past2, styles.past3]

/** The graduation itself: the year engraved on the rule, or "now" at its head. */
function Graduation({ stop }: { readonly stop: PathStop }): ReactElement {
  return (
    <p className={cx(voice.label, styles.year, stop.year === null && styles.now)} data-year="">
      {stop.year === null ? (
        <span className={styles.nowPlate}>{workCopy.rule.now}</span>
      ) : (
        <time className={styles.numeral} dateTime={stop.key}>
          {stop.key}
        </time>
      )}
    </p>
  )
}

interface AsideProps {
  readonly stop: PathStop
  /** How many of the stops after this one its tags hang past. */
  readonly past: number
  readonly totals: readonly PathTotal[]
}

/** How a stop's stickers are set out depends on whether a job's tag is beside them. */
function marksLayout({ jobs }: PathStop, past: number): MarksLayout {
  if (jobs.length === 0) {
    return 'abreast'
  }
  return past === 0 ? 'down' : 'beside'
}

/**
 * What is stuck down on the other side of the rule from the jobs: the running
 * count beside the present, what else happened in a year, and the university.
 */
function Aside({ stop, past, totals }: AsideProps): ReactElement | null {
  const count = stop.year === null ? totals.length : stop.marks.length
  if (count === 0 && stop.schools.length === 0) {
    return null
  }

  return (
    <div className={styles.aside} data-aside="">
      {stop.year === null ? (
        <PathTotals totals={totals} />
      ) : (
        <PathMarks marks={stop.marks} year={stop.year} layout={marksLayout(stop, past)} />
      )}
      {stop.schools.map((school) => (
        <PermitTag key={school.id} school={school} />
      ))}
    </div>
  )
}

interface StopProps extends AsideProps {
  readonly owner: Owner
}

/** One stop on the path: its graduation, the jobs that hang from it, and what else happened. */
function Stop({ stop, past, totals, owner }: StopProps): ReactElement {
  const quiet = isQuiet(stop)

  return (
    <li
      className={cx(styles.stop, stop.year === null && styles.present, quiet && styles.quiet)}
      data-stop={stop.key}
      data-quiet={quiet ? '' : undefined}
    >
      <Graduation stop={stop} />
      {stop.jobs.length > 0 && (
        <div className={cx(styles.tags, REACH[past])} data-tags="" data-past={past}>
          {stop.jobs.map((job) => (
            <JobTag key={job.role.id} job={job} barcode={barcodeText(owner, job.assetNumber)} />
          ))}
        </div>
      )}
      <Aside stop={stop} past={past} totals={totals} />
    </li>
  )
}

interface CareerPathProps {
  readonly stops: readonly PathStop[]
  /** The running count, set beside the present. */
  readonly totals: readonly PathTotal[]
  readonly profile: Owner
}

/**
 * The path, drawn on a steel rule laid on the cutting mat: the present at its
 * head, then a graduation to a year. Jobs hang off one side of the rule and
 * everything else is stuck down along the other. The rule is not to scale: a
 * year is as long as what happened in it, and a year in which nothing did is
 * a break in the steel.
 */
export function CareerPath({ stops, totals, profile }: CareerPathProps): ReactElement {
  return (
    <div className={styles.path} data-path="">
      <ol className={styles.stops} role="list" aria-label={workCopy.rule.list}>
        {stops.map((stop, index) => (
          <Stop
            key={stop.key}
            stop={stop}
            past={hangsPast(stops, index)}
            totals={totals}
            owner={profile}
          />
        ))}
      </ol>
      <span className={styles.foot} aria-hidden="true" data-rule-foot="">
        <span className={cx(voice.label, styles.unit)}>{workCopy.rule.unit}</span>
      </span>
    </div>
  )
}
