import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import foil from '../../stickers/foil.module.css'
import { Lines } from '../../stickers/Lines'
import { svgId } from '../../stickers/svgIds'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { LinkChips } from '../projects/parts/LinkChips'
import { Stuck } from '../Stuck'
import styles from './BackstagePass.module.css'
import { talksCopy } from './copy'
import type { PassRun, WorkshopPass } from './tour'

interface BackstagePassProps {
  readonly pass: WorkshopPass
}

/** A run is listed when the record says where or when it was. */
function isRecorded({ venue, year }: PassRun): boolean {
  return venue !== null || year !== null
}

/**
 * A laminated backstage pass for the workshop he has given more than once:
 * its title, how many times the records say it was given, and where.
 */
export function BackstagePass({ pass }: BackstagePassProps): ReactElement {
  const { pass: words } = talksCopy
  const titleId = svgId('talks', svgId(pass.id, 'pass'))

  return (
    <article className={styles.pass} aria-labelledby={titleId}>
      <Stuck className={styles.laminate}>
        <Vinyl as="div" tone="gum" className={styles.body}>
          <span className={styles.slot} aria-hidden="true" />
          <p className={styles.band}>
            <span className={cx(voice.display, styles.backstage)}>{words.band} </span>
            <span className={cx(voice.label, styles.access)}>{words.access}</span>
          </p>
          <h3 id={titleId} className={cx(voice.display, styles.title)}>
            <Lines lines={pass.lines} />
          </h3>
          {pass.format !== null && (
            <p className={cx(voice.label, foil.foil, styles.format)}>{pass.format}</p>
          )}
          <p className={cx(voice.marker, styles.note)}>{words.note}</p>
          <p className={cx(voice.display, styles.given)}>{words.given(pass.given.length)}</p>
          <ul className={styles.runs} role="list">
            {pass.given.filter(isRecorded).map(({ id, venue, year }) => (
              <li key={id} className={cx(voice.label, styles.run)} data-run="">
                {venue !== null && <span>{venue} </span>}
                {year !== null && <span className={styles.year}>{year}</span>}
              </li>
            ))}
          </ul>
        </Vinyl>
      </Stuck>
      <LinkChips links={pass.links} context={pass.title} className={styles.links} />
    </article>
  )
}
