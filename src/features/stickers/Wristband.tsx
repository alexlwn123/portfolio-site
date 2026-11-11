import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Star } from './illustrations/Glyphs'
import { type Tone, toneClass } from './tones'
import styles from './Wristband.module.css'

interface WristbandLink {
  readonly label: string
  readonly href: string
}

interface WristbandProps {
  readonly tone: Tone
  readonly links: readonly WristbandLink[]
}

/** White stars disappear on the pale bands, so those take ink. */
const PALE: readonly Tone[] = ['hi', 'white', 'mint']

/** A wristband printed with a row of links, a star between each pair. */
export function Wristband({ tone, links }: WristbandProps): ReactElement {
  return (
    <div className={cx(styles.band, toneClass(tone), PALE.includes(tone) && styles.inkStars)}>
      <ul className={styles.links} role="list">
        {links.map(({ label, href }, index) => (
          <li key={href} className={styles.item}>
            {index > 0 && <Star className={styles.star} />}
            <a className={styles.link} href={href}>
              {label}
            </a>
          </li>
        ))}
      </ul>
      <span className={styles.tab} aria-hidden="true" />
    </div>
  )
}
