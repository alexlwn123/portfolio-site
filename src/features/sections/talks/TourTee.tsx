import { Fragment, type ReactElement } from 'react'

import type { Talk } from '../../../content'
import { cx } from '../../../lib/classNames'
import { ArrowRight, Star } from '../../stickers/illustrations/Glyphs'
import { Lines } from '../../stickers/Lines'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { talksCopy } from './copy'
import {
  type TourDate,
  tourFormats,
  type TourLeg,
  tourLegs,
  type TourYears,
  tourYears,
} from './tour'
import styles from './TourTee.module.css'

const TITLE_ID = 'talks-tour-title'
/** What sets the parts of a line apart: "Panel · Moderator". */
const SEPARATOR = ' · '

interface TourTeeProps {
  /** Whose tour it is. */
  readonly name: string
  readonly talks: readonly Talk[]
}

/**
 * The shoulders, sleeves and collar of the shirt, seen from the back. Its
 * sides run straight down into the body, which is drawn in CSS so that it can
 * be as long as the list of dates. A drawing: the print names the shirt.
 */
function Yoke(): ReactElement {
  return (
    <svg className={styles.yoke} viewBox="0 0 620 190" aria-hidden="true" focusable="false">
      <path
        className={styles.cut}
        d="M83 190V128L40 152 12 92 250 14Q310 44 370 14L608 92 580 152 537 128V190"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path className={styles.seam} d="M242 20Q310 58 378 20" strokeWidth="5" />
      <path
        className={styles.seam}
        d="M24 98L49 146M596 98L571 146"
        strokeWidth="2.4"
        strokeDasharray="5 5"
      />
    </svg>
  )
}

/** The first and last years of the tour, with a bar drawn between them. */
function Years({ years }: { readonly years: TourYears }): ReactElement {
  return (
    <span className={cx(voice.display, styles.years)}>
      <span>{years.first}</span>
      {years.last !== years.first && (
        <>
          <span className={styles.dash} aria-hidden="true" />
          <span className={voice.srOnly}> {talksCopy.tour.to} </span>
          <span>{years.last}</span>
        </>
      )}
    </span>
  )
}

/** One date of the tour: when, where, what, and his part in it. */
function TourLine({ date }: { readonly date: TourDate }): ReactElement {
  const { id, day, iso, venue, title, parts, link, more } = date

  return (
    <li className={styles.date} data-talk={id}>
      {day !== null && iso !== null && (
        <time className={cx(voice.label, styles.when)} dateTime={iso}>
          {day}
        </time>
      )}
      <p className={cx(voice.label, styles.where)}>
        {venue !== null && <span className={styles.venue}>{venue} </span>}
        {parts.length > 0 && <span className={styles.parts}>{parts.join(SEPARATOR)}</span>}
      </p>
      <p className={styles.what}>
        {link === null ? (
          <span className={cx(voice.label, styles.title)}>{title}</span>
        ) : (
          <a className={cx(voice.label, styles.title, styles.linked)} href={link.url}>
            {title}
            <span className={voice.srOnly}> {talksCopy.tour.leadsTo(link.label)}</span>
            <ArrowRight className={styles.arrow} />
          </a>
        )}
        {more.map((extra) => (
          <a key={extra.url} className={cx(voice.label, styles.more)} href={extra.url}>
            {extra.label}
            <span className={voice.srOnly}>: {title}</span>
          </a>
        ))}
      </p>
    </li>
  )
}

/** The dates of one year, under the year. */
function Leg({ leg }: { readonly leg: TourLeg }): ReactElement {
  return (
    <li className={styles.leg}>
      <h4 className={cx(voice.display, styles.year)}>{leg.year ?? talksCopy.tour.undated}</h4>
      <ul className={styles.dates} role="list">
        {leg.dates.map((date) => (
          <TourLine key={date.id} date={date} />
        ))}
      </ul>
    </li>
  )
}

/**
 * The back of a tour shirt, as one giant sticker: his name, the tour and its
 * years, then every dated appearance as a line of the print, newest first.
 * Each title leads to its recording or its page where the record has one.
 */
export function TourTee({ name, talks }: TourTeeProps): ReactElement {
  const years = tourYears(talks)
  const formats = tourFormats(talks)

  return (
    <article className={styles.tee} aria-labelledby={TITLE_ID}>
      <Stuck className={styles.cloth}>
        <Yoke />
        <div className={styles.print}>
          <h3 id={TITLE_ID} className={styles.headline}>
            <span className={cx(voice.label, styles.act)}>{name} </span>
            <span className={cx(voice.display, styles.tour)}>
              <Lines lines={talksCopy.tour.title} />
            </span>
            {years !== null && <Years years={years} />}
          </h3>
          {formats.length > 0 && (
            <p className={cx(voice.label, styles.formats)}>
              {formats.map((format, index) => (
                <Fragment key={format}>
                  {index > 0 && <Star className={styles.star} />}
                  <span>{talksCopy.tour.formats[format]} </span>
                </Fragment>
              ))}
            </p>
          )}
          <ol className={styles.legs} aria-label={talksCopy.tour.dates} role="list">
            {tourLegs(talks).map((leg) => (
              <Leg key={leg.year ?? talksCopy.tour.undated} leg={leg} />
            ))}
          </ol>
          <p className={cx(voice.label, styles.size)}>{talksCopy.tour.size}</p>
        </div>
      </Stuck>
    </article>
  )
}
