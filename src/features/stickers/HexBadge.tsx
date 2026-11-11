import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { HEX } from './geometry/hex'
import styles from './HexBadge.module.css'
import paint from './paint.module.css'
import { paintRef, SHARED_IDS } from './svgIds'
import voice from './voice.module.css'

interface HexBadgeProps {
  /** The small line over the title, such as "1st overall". */
  readonly kicker: string
  /** The title, one word to a line. */
  readonly title: readonly string[]
  /** The small line under it. */
  readonly foot: string
}

interface LineProps {
  readonly y: number
  readonly size: number
  readonly voiced: string | undefined
  readonly children: string
}

/** One centred line of ink lettering. */
function Line({ y, size, voiced, children }: LineProps): ReactElement {
  return (
    <text
      className={cx(voiced, paint.ink)}
      x={HEX.centreX}
      y={y}
      fontSize={size}
      textAnchor="middle"
    >
      {children}
    </text>
  )
}

/** A foil hexagon with a lightning bolt over a short title. A drawing: the caller names it. */
export function HexBadge({ kicker, title, foot }: HexBadgeProps): ReactElement {
  const lastTitleY = HEX.title.y + Math.max(0, title.length - 1) * HEX.title.pitch

  return (
    <svg className={paint.art} viewBox="0 0 180 204" aria-hidden="true" focusable="false">
      <polygon
        className={styles.edge}
        points={HEX.outline}
        fill={paintRef(SHARED_IDS.foil)}
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <polygon
        className={cx(paint.hollow, paint.inkLine)}
        points={HEX.keyline}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path className={paint.ink} d={HEX.bolt} />
      <Line {...HEX.kicker} voiced={voice.label}>
        {kicker}
      </Line>
      {title.map((word, index) => (
        <Line
          key={word}
          y={HEX.title.y + index * HEX.title.pitch}
          size={HEX.title.size}
          voiced={voice.display}
        >
          {word}
        </Line>
      ))}
      <Line y={lastTitleY + HEX.foot.gap} size={HEX.foot.size} voiced={voice.label}>
        {foot}
      </Line>
    </svg>
  )
}
