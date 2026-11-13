import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { MEDAL, MEDAL_RIM_PATH, medalRim, medalStarTransform } from './geometry/medal'
import { STAR_PATH } from './illustrations/Glyphs'
import styles from './Medal.module.css'
import paint from './paint.module.css'
import { fragment, svgId } from './svgIds'
import { type Tone, toneClass } from './tones'
import voice from './voice.module.css'

interface MedalProps {
  /** The sticker this drawing belongs to. Its rim's id is built from it. */
  readonly id: string
  /** The place taken, such as "1st". */
  readonly rank: string
  /** Short lines under the rank. */
  readonly lines: readonly string[]
  /** The two phrases set round the rim: over the top, and along the bottom. */
  readonly rim: readonly [string, string]
  readonly tone: Tone
}

interface RimProps {
  /** The id of the path the lettering stands on. */
  readonly path: string
  readonly phrases: readonly [string, string]
}

/** The lettering round the rim, with a drawn star in the gap on either side. */
function Rim({ path, phrases }: RimProps): ReactElement {
  const { arcs, starAngles } = medalRim(...phrases)

  return (
    <>
      {arcs.map(({ start, length }, index) => (
        <text key={start} className={cx(voice.label, paint.ink)} fontSize={MEDAL.rimSize}>
          <textPath href={fragment(path)} startOffset={start} textLength={length}>
            {phrases[index]}
          </textPath>
        </text>
      ))}
      {starAngles.map((angle) => (
        <path
          key={angle}
          className={paint.ink}
          d={STAR_PATH}
          transform={medalStarTransform(angle)}
        />
      ))}
    </>
  )
}

/** The rank, big, over its short lines. */
function Middle({ rank, lines }: Pick<MedalProps, 'rank' | 'lines'>): ReactElement {
  return (
    <>
      <text
        className={cx(voice.display, paint.ink)}
        x={MEDAL.centre}
        y={MEDAL.rank.y}
        fontSize={MEDAL.rank.size}
        textAnchor="middle"
      >
        {rank}
      </text>
      {lines.map((line, index) => (
        <text
          key={line}
          className={cx(voice.label, paint.ink)}
          x={MEDAL.centre}
          y={MEDAL.lines.y + index * MEDAL.lines.pitch}
          fontSize={MEDAL.lines.size}
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </>
  )
}

/**
 * A medal for one win: the rank in the middle, lettered round the rim. A
 * drawing: the caller names it.
 */
export function Medal({ id, rank, lines, rim, tone }: MedalProps): ReactElement {
  const path = svgId(id, 'rim')
  const { centre } = MEDAL

  return (
    <svg
      className={cx(paint.art, toneClass(tone))}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={path} d={MEDAL_RIM_PATH} />
      </defs>
      <circle className={paint.white} cx={centre} cy={centre} r={MEDAL.edge} />
      <circle className={styles.face} cx={centre} cy={centre} r={MEDAL.face} />
      <circle
        className={cx(paint.hollow, paint.inkLine)}
        cx={centre}
        cy={centre}
        r={MEDAL.stitch}
        strokeWidth="2.4"
        strokeDasharray="1 6"
        strokeLinecap="round"
      />
      <Rim path={path} phrases={rim} />
      <Middle rank={rank} lines={lines} />
    </svg>
  )
}
