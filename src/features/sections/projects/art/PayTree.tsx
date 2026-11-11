import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the banner tied round the tree. */
const NAME = Object.freeze({ x: 100, y: 165, width: 142, max: 21 })

/** One payment at the top, branching into two and then four. */
const BRANCHES =
  'M100 42L78 84M100 42L122 84M78 84L62 120M78 84L92 120M122 84L108 120M122 84L138 120'
const NODES = ['100 42', '78 84', '122 84', '62 120', '92 120', '108 120', '138 120'] as const

/** Three tiers of fir on a trunk, widest at the bottom. */
function Fir(): ReactElement {
  return (
    <>
      <rect
        className={cx(paint.tang, paint.inkLine)}
        x="84"
        y="186"
        width="32"
        height="38"
        rx="4"
        strokeWidth="6"
      />
      <g className={cx(paint.mint, paint.inkLine)} strokeWidth="6" strokeLinejoin="round">
        <path d="M100 98L180 192H20Z" />
        <path d="M100 52L162 134H38Z" />
        <path d="M100 12L144 78H56Z" />
      </g>
    </>
  )
}

/** A fir tree with a tree of payments drawn on it. */
export function PayTree({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 0 200 236">
      <Fir />
      <path className={cx(paint.hollow, paint.inkLine)} d={BRANCHES} strokeWidth="3" />
      <g className={cx(paint.white, paint.inkLine)} strokeWidth="3">
        {NODES.map((at) => {
          const [x, y] = at.split(' ')
          return <circle key={at} cx={x} cy={y} r="6.5" />
        })}
      </g>
      <rect
        className={cx(paint.hi, paint.inkLine)}
        x="14"
        y="144"
        width="172"
        height="42"
        rx="9"
        strokeWidth="5"
        transform="rotate(-3 100 165)"
      />
      <g transform="rotate(-3 100 165)">
        <Lettering lines={[lines.join(' ')]} at={NAME} />
      </g>
    </DieCut>
  )
}
