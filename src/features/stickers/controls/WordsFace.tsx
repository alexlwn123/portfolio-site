import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { Lines } from '../Lines'
import type { Tone } from '../tones'
import { Vinyl } from '../Vinyl'
import voice from '../voice.module.css'
import styles from './controls.module.css'

interface WordsFaceProps {
  /** The first line is shouted, the rest is small print. Together they name the button. */
  readonly lines: readonly string[]
  readonly tone: Tone
}

/** A small sticker of two or three words: the face of a button that says what it does. */
export function WordsFace({ lines, tone }: WordsFaceProps): ReactElement {
  const [first = '', ...rest] = lines

  return (
    <Vinyl className={styles.words} tone={tone}>
      <span className={cx(voice.display, styles.shout)}>{first} </span>
      <span className={cx(voice.label, styles.rest)}>
        <Lines lines={rest} />
      </span>
    </Vinyl>
  )
}
