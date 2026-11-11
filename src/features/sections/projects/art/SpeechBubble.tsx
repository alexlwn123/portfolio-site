import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** In the bubble at the front. */
const NAME = Object.freeze({ x: 109, y: 110, width: 150, max: 34 })

const BEHIND =
  'M98 14H208a26 26 0 0 1 26 26V84a26 26 0 0 1-26 26H98a26 26 0 0 1-26-26V40a26 26 0 0 1 26-26Z'
const FRONT =
  'M42 58H176a28 28 0 0 1 28 28V134a28 28 0 0 1-28 28H92L44 192 56 162H42a28 28 0 0 1-28-28V86a28 28 0 0 1 28-28Z'

/** Two speech bubbles, one over the other: a debate, with a vote for and a vote against. */
export function SpeechBubble({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 0 250 200">
      <path
        className={cx(paint.gum, paint.inkLine)}
        d={BEHIND}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        className={cx(paint.hollow, paint.inkLine, styles.pen)}
        d="M164 36l8 8 15-17M204 26l14 14M218 26l-14 14"
        strokeWidth="6"
      />
      <path
        className={cx(paint.white, paint.inkLine)}
        d={FRONT}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <Lettering lines={lines} at={NAME} />
    </DieCut>
  )
}
