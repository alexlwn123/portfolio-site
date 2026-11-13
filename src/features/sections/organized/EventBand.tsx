import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import foil from '../../stickers/foil.module.css'
import voice from '../../stickers/voice.module.css'
import type { BandLook } from './bandLooks'
import { organizedCopy } from './copy'
import styles from './EventBand.module.css'

interface EventBandProps {
  /** The number on the band: 1 is the first hackathon he ran. */
  readonly number: number
  readonly name: string
  readonly look: BandLook
}

/** The classes that make a band what its look says it is. */
function lookClasses(look: BandLook): string {
  switch (look.kind) {
    case 'tyvek':
      return cx(styles.tyvek, styles[look.tone], look.thin && styles.thin)
    case 'woven':
      return cx(styles.woven, styles[look.tone], styles[look.weave])
    case 'silicone':
      return cx(styles.silicone, styles[look.tone])
    case 'foil':
      return cx(styles.foil, foil.foil)
    case 'blank':
      return cx(styles.blank)
  }
}

/** What holds the band shut: a printed block on paper, a bead on cloth. */
function Clasp({ look }: { readonly look: BandLook }): ReactElement | null {
  if (look.kind === 'tyvek') {
    return <span className={cx(styles.clasp, styles[look.pattern])} aria-hidden="true" />
  }
  if (look.kind === 'woven') {
    return <span className={styles.bead} aria-hidden="true" />
  }
  return null
}

/**
 * One festival wristband around the arm: its number in a circle, the
 * hackathon's name lettered along it, and its clasp. The name is the heading
 * of the row it is in.
 */
export function EventBand({ number, name, look }: EventBandProps): ReactElement {
  return (
    <div className={cx(styles.band, lookClasses(look))} data-band={look.kind}>
      <span className={cx(voice.display, styles.number)} aria-hidden="true">
        {number}
      </span>
      <span className={voice.srOnly}>{organizedCopy.bandNumber(number)}</span>
      <h3 className={cx(look.kind === 'blank' ? voice.marker : voice.label, styles.name)}>
        {name}
      </h3>
      <Clasp look={look} />
    </div>
  )
}
