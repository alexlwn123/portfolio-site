import type { ReactElement } from 'react'

import type { Profile } from '../../../content'
import { cx } from '../../../lib/classNames'
import voice from '../../stickers/voice.module.css'
import styles from './CareerPath.module.css'
import { workCopy } from './copy'
import { barcodeText } from './describe'
import { JobTag } from './JobTag'
import type { PathStop } from './path'
import { PathMarks } from './PathMarks'
import { PathTotals } from './PathTotals'
import { PermitTag } from './PermitTag'
import type { PathTotal } from './totals'

type Owner = Pick<Profile, 'givenName' | 'familyName'>

interface StopProps {
  readonly stop: PathStop
  readonly totals: readonly PathTotal[]
  readonly owner: Owner
}

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

/** One stop on the path: its graduation, the tags that hang from it, and what else happened. */
function Stop({ stop, totals, owner }: StopProps): ReactElement {
  const hasTags = stop.jobs.length > 0 || stop.schools.length > 0

  return (
    <li className={cx(styles.stop, stop.year === null && styles.present)} data-stop={stop.key}>
      <Graduation stop={stop} />
      {hasTags && (
        <div className={styles.tags} data-tags="">
          {stop.jobs.map((job) => (
            <JobTag key={job.role.id} job={job} barcode={barcodeText(owner, job.assetNumber)} />
          ))}
          {stop.schools.map((school) => (
            <PermitTag key={school.id} school={school} />
          ))}
        </div>
      )}
      {stop.year === null ? (
        <PathTotals totals={totals} />
      ) : (
        <PathMarks marks={stop.marks} year={stop.year} />
      )}
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
 * everything else is stuck down along the other.
 */
export function CareerPath({ stops, totals, profile }: CareerPathProps): ReactElement {
  return (
    <div className={styles.path} data-path="">
      <span className={styles.rule} aria-hidden="true">
        <span className={cx(voice.label, styles.unit)}>{workCopy.rule.unit}</span>
      </span>
      <ol className={styles.stops} role="list" aria-label={workCopy.rule.list}>
        {stops.map((stop) => (
          <Stop key={stop.key} stop={stop} totals={totals} owner={profile} />
        ))}
      </ol>
    </div>
  )
}
