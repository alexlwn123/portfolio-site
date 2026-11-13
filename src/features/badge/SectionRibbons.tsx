import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { linkTo } from '../../lib/linkTo'
import { toneClass } from '../stickers/tones'
import voice from '../stickers/voice.module.css'
import { isPinned, type LinkRibbon, type Pin, type PinnedRibbon, type Ribbon } from './ribbons'
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
 * An enamel pin. The link keeps its place and the enamel inside it lifts, so
 * a pointer resting on its edge stays on it.
 */
function PinLink({ pin }: { readonly pin: Pin }): ReactElement {
  return (
    <a className={cx(styles.pin, toneClass(pin.tone))} data-pin="" {...linkTo(pin.href)}>
      <span className={cx(voice.label, styles.enamel)}>
        {pin.label} <span className={styles.count}>{pin.count}</span>
      </span>
    </a>
  )
}

/**
 * A ribbon with pins stuck on it. It is twice a ribbon's depth, and not a
 * link: its word says what the pins are about, and each pin leads somewhere.
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
          <li key={pin.href} className={styles.pinItem}>
            <PinLink pin={pin} />
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
