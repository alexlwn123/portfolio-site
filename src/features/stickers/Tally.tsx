import type { ReactElement } from 'react'

import { tallyMarks } from './geometry/tally'
import paint from './paint.module.css'
import styles from './Tally.module.css'

interface TallyProps {
  /** How many marks to draw. They come in fives: four uprights and a slash. */
  readonly count: number
}

/** A count kept the old way. A drawing: the number it shows is stated elsewhere. */
export function Tally({ count }: TallyProps): ReactElement {
  const { width, height, strokes } = tallyMarks(count)

  return (
    <svg
      className={paint.art}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.marks}>
        {strokes.map((stroke) => (
          <path key={stroke} d={stroke} />
        ))}
      </g>
    </svg>
  )
}
