import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { toneClass } from '../../stickers/tones'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { contactCopy } from './copy'
import styles from './LinkBands.module.css'
import type { ContactBand } from './links'

interface LinkBandsProps {
  readonly bands: readonly ContactBand[]
}

/**
 * A strip of event wristband for every link, the whole strip the link: snap
 * holes at the wrist end, the lettering, and a tear-off tab.
 */
export function LinkBands({ bands }: LinkBandsProps): ReactElement | null {
  if (bands.length === 0) {
    return null
  }

  return (
    <ul className={styles.bands} role="list" aria-label={contactCopy.bands.list} data-bands="">
      {bands.map(({ id, label, href, tone }) => (
        <li key={id} className={styles.item} data-band={id}>
          <Stuck href={href} className={styles.link}>
            <span className={cx(styles.band, toneClass(tone))}>
              <span className={styles.snaps} aria-hidden="true" />
              <span className={cx(voice.label, styles.label)}>{label}</span>
              <span className={styles.tab} aria-hidden="true" />
            </span>
          </Stuck>
        </li>
      ))}
    </ul>
  )
}
