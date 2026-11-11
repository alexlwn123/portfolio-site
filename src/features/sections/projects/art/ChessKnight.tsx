import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the plinth the board stands on. */
const NAME = Object.freeze({ x: 100, y: 199, width: 160, max: 18 })

/** The dark squares of a four-by-four corner of the board. */
const SQUARES = [
  '26 24',
  '100 24',
  '63 61',
  '137 61',
  '26 98',
  '100 98',
  '63 135',
  '137 135',
] as const

/** A knight, facing left: ears, forehead, muzzle, chest, and a long arched neck. */
const KNIGHT =
  'M62 170C64 148 86 136 92 114C82 122 70 124 60 118L48 106C46 92 58 74 76 62L72 36 92 50C132 46 154 88 148 170Z'

function Board(): ReactElement {
  return (
    <>
      <rect
        className={cx(paint.white, paint.inkLine)}
        x="16"
        y="14"
        width="168"
        height="168"
        rx="16"
        strokeWidth="6"
      />
      <g className={paint.gum}>
        {SQUARES.map((at) => {
          const [x, y] = at.split(' ')
          return <rect key={at} x={x} y={y} width="37" height="37" />
        })}
      </g>
    </>
  )
}

/** A chess knight on a corner of the board. The bot solved the site's puzzles. */
export function ChessKnight({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 4 200 222">
      <Board />
      <path
        className={cx(paint.ink, paint.whiteLine)}
        d={KNIGHT}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle className={paint.white} cx="78" cy="84" r="5" />
      <path
        className={cx(paint.hollow, paint.whiteLine, styles.pen)}
        d="M112 66l10 7M126 84l10 5M134 106l10 3M52 106l5 4"
        strokeWidth="3"
      />
      <rect className={paint.ink} x="8" y="176" width="184" height="46" rx="13" />
      <Lettering lines={[lines.join(' ')]} at={NAME} tone={paint.hi} />
    </DieCut>
  )
}
