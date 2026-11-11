import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Barcode.module.css'
import { code39 } from './geometry/code39'
import paint from './paint.module.css'

interface BarcodeProps {
  /** What the bars spell, in Code 39: capitals, digits and dashes. */
  readonly text: string
  /** The box the bars are stretched to. */
  readonly className?: string | undefined
}

/** The drawing has no height of its own: its bars are stretched to its box. */
const BAR_HEIGHT = 10

/**
 * A barcode that says what it claims to: the text, in Code 39. A drawing for
 * the eye, so whatever it spells is printed beside it by whoever uses it.
 */
export function Barcode({ text, className }: BarcodeProps): ReactElement {
  const { width, bars } = code39(text)

  return (
    <svg
      className={cx(styles.bars, className)}
      viewBox={`0 0 ${String(width)} ${String(BAR_HEIGHT)}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((bar) => (
        <rect
          key={bar.x}
          className={paint.ink}
          x={bar.x}
          y={0}
          width={bar.width}
          height={BAR_HEIGHT}
        />
      ))}
    </svg>
  )
}
