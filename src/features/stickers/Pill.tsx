import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Pill.module.css'
import { type Tone, toneClass } from './tones'

interface PillProps {
  readonly text: string
  readonly tone: Tone
  /** A size up, for a phrase instead of a single word. */
  readonly big?: boolean
}

export function Pill({ text, tone, big = false }: PillProps): ReactElement {
  return <span className={cx(styles.pill, toneClass(tone), big && styles.big)}>{text}</span>
}
