import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { linkTo } from '../../lib/linkTo'
import { toneClass } from '../stickers/tones'
import voice from '../stickers/voice.module.css'
import { PinButton } from './PinButton'
import { isPinned, type LinkRibbon, type PinnedRibbon, type Ribbon } from './ribbons'
import styles from './SectionRibbons.module.css'

interface SectionRibbonsProps {
  /** The name of the navigation landmark. */
  readonly label: string
  readonly ribbons: readonly Ribbon[]
}

/** A ribbon that is a link: the whole of it leads to its section. */
function LinkedRibbon({ ribbon }: { readonly ribbon: LinkRibbon }): ReactElement {
  return (
    <a
      className={cx(styles.ribbon, toneClass(ribbon.tone))}
      data-ribbon=""
      {...linkTo(ribbon.href)}
    >
      <span className={cx(voice.display, styles.face)}>{ribbon.label}</span>
    </a>
  )
}

/**
 * A ribbon with buttons pinned to it. It is twice a ribbon's depth, and not a
 * link: its word says what the buttons are about, and each button leads
 * somewhere.
 */
function RibbonWithPins({ ribbon }: { readonly ribbon: PinnedRibbon }): ReactElement {
  return (
    <div className={cx(styles.ribbon, styles.pinned, toneClass(ribbon.tone))}>
      <span className={cx(voice.display, styles.face)}>
        <span className={styles.word} data-ribbon="">
          {ribbon.label}
        </span>
      </span>
      <ul className={styles.pins} role="list">
        {ribbon.pins.map((pin) => (
          <li key={pin.id} className={styles.pinItem}>
            <PinButton pin={pin} />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The badge's stick-on ribbons: the page's section navigation. */
export function SectionRibbons({ label, ribbons }: SectionRibbonsProps): ReactElement {
  return (
    <nav className={styles.ribbons} aria-label={label}>
      <ul className={styles.list} role="list">
        {ribbons.map((ribbon) => (
          <li key={ribbon.label} className={styles.item}>
            {isPinned(ribbon) ? (
              <RibbonWithPins ribbon={ribbon} />
            ) : (
              <LinkedRibbon ribbon={ribbon} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
