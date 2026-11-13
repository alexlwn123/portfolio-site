import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import paint from '../../stickers/paint.module.css'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { patentsCopy } from './copy'
import styles from './InspectionStickers.module.css'

interface InspectionStickersProps {
  /** Who signed the inspection off: his initials. */
  readonly initials: string
}

/** A tick, drawn with a marker. None of the site's typefaces has one. */
function Tick(): ReactElement {
  return (
    <svg className={styles.tick} viewBox="0 0 40 34" aria-hidden="true" focusable="false">
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d="M4 19q5 4 9 11Q22 12 37 4"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The two stickers on the plate: an emoji cut out along its own outline, and
 * a quality check signed off in marker. The quality check is made up, and
 * imitates no real regulatory mark.
 */
export function InspectionStickers({ initials }: InspectionStickersProps): ReactElement {
  const { quality, emoji } = patentsCopy.stickers

  return (
    <ul className={styles.stickers} role="list" aria-label={patentsCopy.stickers.list}>
      <Stuck as="li" className={styles.emoji}>
        <span className={styles.glyph} role="img" aria-label={emoji.name} data-emoji="">
          {emoji.glyph}
        </span>
      </Stuck>
      <Stuck as="li" className={styles.quality}>
        <span className={styles.qualityFace}>
          <span className={cx(voice.display, styles.stamp)}>{quality.stamp}</span>{' '}
          <span className={styles.signedOff}>
            <span className={cx(voice.marker, styles.verdict)}>
              {quality.verdict} <Tick />
            </span>{' '}
            <span className={cx(voice.marker, styles.signed)}>{initials}</span>
          </span>
        </span>
      </Stuck>
    </ul>
  )
}
