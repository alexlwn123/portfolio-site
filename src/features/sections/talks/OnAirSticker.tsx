import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { LABELS } from '../../cv/labels'
import { svgId } from '../../stickers/svgIds'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { LinkChips } from '../projects/parts/LinkChips'
import { Stuck } from '../Stuck'
import { talksCopy } from './copy'
import styles from './OnAirSticker.module.css'
import type { OnAirShow } from './tour'

/** What sets his parts apart: "Podcast · Co-host · Ongoing". */
const SEPARATOR = ' · '

interface OnAirStickerProps {
  readonly show: OnAirShow
}

/**
 * A studio's "on air" sign, lit, for a show that is still running: what it
 * is called, his part in it and where to hear it.
 */
export function OnAirSticker({ show }: OnAirStickerProps): ReactElement {
  const titleId = svgId('talks', svgId(show.id, 'title'))

  return (
    <article className={styles.onAir} aria-labelledby={titleId} data-talk={show.id}>
      <Stuck className={styles.box}>
        <Vinyl as="div" tone="ink" className={styles.case}>
          <p className={cx(voice.display, styles.sign)}>{talksCopy.onAir.sign}</p>
          <h3 id={titleId} className={cx(voice.display, styles.show)}>
            {show.title}
          </h3>
          <p className={cx(voice.label, styles.parts)}>
            {[...show.parts, LABELS.ongoing].join(SEPARATOR)}
          </p>
          {show.detail !== null && <p className={styles.detail}>{show.detail}</p>}
        </Vinyl>
      </Stuck>
      <LinkChips links={show.links} context={show.title} className={styles.links} />
    </article>
  )
}
