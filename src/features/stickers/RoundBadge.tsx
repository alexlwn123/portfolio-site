import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { RING_ARCS, RING_PATH, RING_STAR_ANGLES, ringStarTransform } from './geometry/ring'
import { STAR_PATH } from './illustrations/Glyphs'
import paint from './paint.module.css'
import styles from './RoundBadge.module.css'
import { fragment, svgId } from './svgIds'
import voice from './voice.module.css'

interface RoundBadgeProps {
  /** The sticker this drawing belongs to. Its ring's id is built from it. */
  readonly id: string
  /** The two phrases set around the rim, with a star between them. */
  readonly ring: readonly [string, string]
  /** The big figure in the middle. */
  readonly figure: string
}

/** A round seal: a figure on a globe, captioned around the rim. A drawing: the caller names it. */
export function RoundBadge({ id, ring, figure }: RoundBadgeProps): ReactElement {
  const rim = svgId(id, 'rim')

  return (
    <svg className={paint.art} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <path id={rim} d={RING_PATH} />
      </defs>
      <circle className={paint.white} cx="100" cy="100" r="96" />
      <circle className={paint.mint} cx="100" cy="100" r="88" />
      <g className={styles.globe} strokeWidth="2.2">
        <circle cx="100" cy="100" r="55" />
        <ellipse cx="100" cy="100" rx="26" ry="55" />
        <path d="M45 100h110M53 72h94M53 128h94" />
      </g>
      {RING_ARCS.map(({ start, length }, index) => (
        <text key={start} className={cx(voice.label, paint.ink)} fontSize="14.5">
          <textPath href={fragment(rim)} startOffset={start} textLength={length}>
            {ring[index]}
          </textPath>
        </text>
      ))}
      {RING_STAR_ANGLES.map((angle) => (
        <path
          key={angle}
          className={paint.ink}
          d={STAR_PATH}
          transform={ringStarTransform(angle)}
        />
      ))}
      <text
        className={cx(voice.display, paint.ink)}
        x="100"
        y="128"
        fontSize="80"
        textAnchor="middle"
      >
        {figure}
      </text>
    </svg>
  )
}
