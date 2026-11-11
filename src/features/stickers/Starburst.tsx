import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { type StarburstShape, starburstPoints, WINS_SEAL } from './geometry/starburst'
import paint from './paint.module.css'
import styles from './Starburst.module.css'
import voice from './voice.module.css'

interface StarburstProps {
  readonly top: string
  /** The big figure in the middle, such as "8×". */
  readonly figure: string
  readonly bottom: string
  readonly shape?: StarburstShape
}

/** The figure: ink, with a white copy set just behind it as a shadow. */
function Figure({ text }: { readonly text: string }): ReactElement {
  return (
    <>
      <text
        className={cx(voice.display, styles.figureShadow)}
        x="103"
        y="124"
        fontSize="72"
        textAnchor="middle"
        transform="translate(3 3)"
      >
        {text}
      </text>
      <text
        className={cx(voice.display, paint.ink)}
        x="103"
        y="124"
        fontSize="72"
        textAnchor="middle"
      >
        {text}
      </text>
    </>
  )
}

/** A starburst seal with a figure between two words. A drawing: the caller names it. */
export function Starburst({
  top,
  figure,
  bottom,
  shape = WINS_SEAL,
}: StarburstProps): ReactElement {
  return (
    <svg className={paint.art} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <polygon
        className={styles.burst}
        points={starburstPoints(shape)}
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <circle
        className={cx(paint.hollow, paint.inkLine)}
        cx="100"
        cy="100"
        r="67"
        strokeWidth="2.4"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <text className={cx(voice.label, paint.ink)} x="100" y="58" fontSize="15" textAnchor="middle">
        {top}
      </text>
      <Figure text={figure} />
      <text
        className={cx(voice.display, paint.ink)}
        x="100"
        y="152"
        fontSize="23"
        textAnchor="middle"
      >
        {bottom}
      </text>
    </svg>
  )
}
