import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Cue.module.css'
import { ArrowDown } from './illustrations/Glyphs'
import voice from './voice.module.css'

interface CueProps {
  readonly text: string
}

/** A cue to scroll, written on the lid in his marker, with an arrow drawn after it. */
export function Cue({ text }: CueProps): ReactElement {
  return (
    <span className={cx(voice.marker, styles.cue)}>
      {text}
      <ArrowDown className={styles.arrow} />
    </span>
  )
}
