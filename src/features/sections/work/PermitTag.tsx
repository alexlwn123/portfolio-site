import type { ReactElement } from 'react'

import type { Education } from '../../../content'
import { cx } from '../../../lib/classNames'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { workCopy } from './copy'
import { attendedYears } from './describe'
import styles from './PermitTag.module.css'

interface PermitTagProps {
  readonly school: Education
}

/** The years the permit was good for, as far as the record says. */
function Validity({ school }: PermitTagProps): ReactElement | null {
  const years = attendedYears(school)
  if (years === null) {
    return null
  }

  return (
    <p className={styles.valid}>
      <span className={cx(voice.label, styles.validLabel)}>
        {years.open ? workCopy.permit.from : workCopy.permit.valid}
      </span>{' '}
      <time className={cx(voice.display, styles.years)} dateTime={years.iso}>
        {years.text}
      </time>
    </p>
  )
}

/**
 * The parking permit from the university: where, what he studied, at what
 * level and in which years. The record states no degree, so it claims none.
 */
export function PermitTag({ school }: PermitTagProps): ReactElement {
  const headingId = `school-${school.id}`

  return (
    <article className={styles.permit} data-school={school.id} aria-labelledby={headingId}>
      <Stuck>
        <Vinyl as="div" tone="tang" className={styles.tag}>
          <span className={styles.hole} aria-hidden="true" />
          <h3 id={headingId} className={styles.head}>
            <span className={cx(voice.display, styles.issuer)}>{school.institution}</span>{' '}
            <span className={cx(voice.label, styles.kind)}>{workCopy.permit.kind}</span>
          </h3>
          <Validity school={school} />
          <dl className={cx(voice.label, styles.fields)}>
            <div className={styles.field}>
              <dt className={styles.term}>{workCopy.permit.subject}</dt>
              <dd className={styles.value}>{school.subject}</dd>
            </div>
            <div className={styles.field}>
              <dt className={styles.term}>{workCopy.permit.level}</dt>
              <dd className={styles.value}>{school.level}</dd>
            </div>
          </dl>
        </Vinyl>
      </Stuck>
    </article>
  )
}
