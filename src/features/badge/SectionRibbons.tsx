import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { type Tone, toneClass } from '../stickers/tones'
import voice from '../stickers/voice.module.css'
import styles from './SectionRibbons.module.css'

export interface Ribbon {
  readonly label: string
  /** A count beside the label, such as "×16", or null for none. */
  readonly count: string | null
  readonly href: string
  readonly tone: Tone
}

interface SectionRibbonsProps {
  /** The name of the navigation landmark. */
  readonly label: string
  readonly ribbons: readonly Ribbon[]
}

/** The badge's stick-on ribbons: the page's section navigation. */
export function SectionRibbons({ label, ribbons }: SectionRibbonsProps): ReactElement {
  return (
    <nav className={styles.ribbons} aria-label={label}>
      <ul className={styles.list} role="list">
        {ribbons.map((ribbon) => (
          <li key={ribbon.href} className={styles.item}>
            <a className={cx(styles.ribbon, toneClass(ribbon.tone))} href={ribbon.href}>
              <span className={cx(voice.display, styles.face)}>
                {ribbon.label}
                {ribbon.count !== null && (
                  <>
                    {' '}
                    <span className={styles.count}>{ribbon.count}</span>
                  </>
                )}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
