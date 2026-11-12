import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { formatPartialDate, isoDate } from '../../../lib/formatDate'
import { svgId } from '../../stickers/svgIds'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import styles from './Clipping.module.css'
import type { ClippingSpec, ReferenceSpec } from './clippings'
import { talksCopy } from './copy'

interface ClippingProps {
  readonly clipping: ClippingSpec
}

/**
 * A press cutting, held down with a strip of tape. It prints what was
 * published, and under it the one sentence the record allows about what the
 * piece has to do with him. That sentence is never reworded here.
 */
export function Clipping({ clipping }: ClippingProps): ReactElement {
  const { id, outlet, programme, headline, byline, date, claim, url } = clipping
  const titleId = svgId('talks', svgId(id, 'outlet'))

  return (
    <article className={styles.clipping} aria-labelledby={titleId} data-press={id}>
      <Stuck className={styles.paper}>
        <div className={styles.sheet}>
          <h3 id={titleId} className={styles.masthead}>
            <span className={cx(voice.display, styles.outlet)}>{outlet} </span>
            {programme !== null && (
              <span className={cx(voice.label, styles.programme)}>{programme}</span>
            )}
          </h3>
          <p className={styles.headline}>
            <a className={styles.link} href={url}>
              {headline ?? claim}
            </a>
          </p>
          {(byline !== null || date !== null) && (
            <p className={cx(voice.label, styles.byline)}>
              {byline !== null && <span>{byline} </span>}
              {date !== null && (
                <time dateTime={isoDate(date)}>{formatPartialDate(date, 'long')}</time>
              )}
            </p>
          )}
          {headline !== null && <p className={styles.claim}>{claim}</p>}
        </div>
      </Stuck>
    </article>
  )
}

interface SeeAlsoProps {
  readonly references: readonly ReferenceSpec[]
}

/** The plain pages of reference, on a strip of tape. Renders nothing when there are none. */
export function SeeAlso({ references }: SeeAlsoProps): ReactElement | null {
  if (references.length === 0) {
    return null
  }

  return (
    <p className={styles.seeAlso}>
      <span className={cx(voice.label, styles.lead)}>{talksCopy.press.seeAlso} </span>
      {references.map(({ id, outlet, label, url }) => (
        <a key={id} className={styles.reference} href={url}>
          {label}
          <span className={voice.srOnly}>: {outlet}</span>
        </a>
      ))}
    </p>
  )
}
