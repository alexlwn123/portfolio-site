import type { ReactElement, ReactNode } from 'react'

import type { Patent, Stats } from '../../../content'
import { cx } from '../../../lib/classNames'
import { formatPartialDate, isoDate } from '../../../lib/formatDate'
import { ArrowRight } from '../../stickers/illustrations/Glyphs'
import { Lines } from '../../stickers/Lines'
import metal from '../../stickers/metal.module.css'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { patentsCopy } from './copy'
import {
  coInventorsField,
  numberField,
  type PlateCount,
  plateCount,
  plateFilings,
  recordSource,
} from './plate'
import styles from './RatingPlate.module.css'

/** A rivet to a corner. */
const RIVETS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const

interface FieldProps {
  readonly label: string
  readonly className?: string | undefined
  readonly children: ReactNode
}

/** One boxed field: its label, and what is stamped in it. */
function Field({ label, className, children }: FieldProps): ReactElement {
  return (
    <div className={cx(styles.field, className)}>
      <dt className={styles.term}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  )
}

function DateValue({ date }: { readonly date: NonNullable<Patent['filed']> }): ReactElement {
  return <time dateTime={isoDate(date)}>{formatPartialDate(date)}</time>
}

/** One filing: its title, then its number, filing date, assignee and co-inventors. */
function PlateRow({ patent }: { readonly patent: Patent }): ReactElement {
  const number = numberField(patent)
  const others = coInventorsField(patent)

  return (
    <li className={styles.row} data-patent={patent.id}>
      <h3 className={styles.title}>{patent.title}</h3>
      <dl className={cx(voice.label, styles.fields)}>
        <Field label={number.label} className={styles.numberField}>
          <a className={styles.number} href={patent.link.url}>
            <span className={styles.stamp}>
              <span>{number.value}</span>{' '}
              <span className={voice.srOnly}>{patentsCopy.plate.on(patent.link.label)}</span>
              <ArrowRight className={styles.arrow} />
            </span>
          </a>
        </Field>
        {patent.filed !== null && (
          <Field label={patentsCopy.plate.fields.filed}>
            <DateValue date={patent.filed} />
          </Field>
        )}
        <Field label={patentsCopy.plate.fields.assignee}>{patent.assignee}</Field>
        {others !== null && <Field label={others.label}>{others.value}</Field>}
      </dl>
    </li>
  )
}

/** The one count: a big figure, with the words that say what it counts either side of it. */
function CountBox({ label, count, unit }: PlateCount): ReactElement {
  return (
    <dl className={cx(voice.label, styles.facts)}>
      <div className={cx(styles.field, styles.count)} data-count="">
        <dt className={styles.term}>{label}</dt>
        <dd className={styles.value}>
          <span className={styles.figure} data-figure="">
            {count}
          </span>{' '}
          <span className={styles.unit}>{unit}</span>
        </dd>
      </div>
    </dl>
  )
}

interface PlateHeadProps {
  readonly holder: string
  readonly stats: Stats['patents']
}

/** The top of the plate: what it lists, whose name is on them, and how many there are. */
function PlateHead({ holder, stats }: PlateHeadProps): ReactElement {
  const count = plateCount(stats)

  return (
    <header className={styles.head}>
      <div className={styles.lead}>
        <p className={cx(voice.display, styles.heading)}>
          <Lines lines={patentsCopy.plate.heading} />
        </p>
        <dl className={cx(voice.label, styles.facts)}>
          <Field label={patentsCopy.plate.holder} className={styles.holder}>
            {holder}
          </Field>
        </dl>
      </div>
      {count !== null && <CountBox {...count} />}
    </header>
  )
}

interface RatingPlateProps {
  readonly patents: readonly Patent[]
  readonly stats: Stats['patents']
  /** The name stamped on the plate: his. */
  readonly holder: string
}

/**
 * The rating plate on the underside of the machine: brushed metal, riveted at
 * the corners, a row to a filing. Every filing that names him is counted and
 * listed the same way, and every number opens its public record.
 */
export function RatingPlate({ patents, stats, holder }: RatingPlateProps): ReactElement {
  const filings = plateFilings(patents)
  const source = recordSource(filings)

  return (
    <Stuck>
      <div className={cx(metal.brushed, styles.plate)} data-plate="">
        {RIVETS.map((corner) => (
          <span
            key={corner}
            className={cx(styles.rivet, styles[corner])}
            data-rivet=""
            aria-hidden="true"
          />
        ))}
        <PlateHead holder={holder} stats={stats} />
        {filings.length > 0 && (
          <ol className={styles.rows} role="list" aria-label={patentsCopy.plate.list}>
            {filings.map((patent) => (
              <PlateRow key={patent.id} patent={patent} />
            ))}
          </ol>
        )}
        {source !== null && (
          <p className={cx(voice.label, styles.footnote)}>{patentsCopy.plate.footnote(source)}</p>
        )}
      </div>
    </Stuck>
  )
}
