import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** Inside the selection the pointer has just dragged out. */
const NAME = Object.freeze({ x: 96, y: 128, width: 114, max: 20 })

/** A square with a knob on top, a knob on the right and a notch underneath. */
const PIECE = 'M24 62H78a22 22 0 1 1 36 0H168V116a22 22 0 1 1 0 36V206H114a22 22 0 1 0-36 0H24Z'

/** Where the selection's four handles sit. */
const HANDLES = ['27 89', '156 89', '27 158', '156 158'] as const

/** The dashed box of a selection, its handles and the pointer that drew it. */
function Selection(): ReactElement {
  return (
    <>
      <rect
        className={cx(paint.hollow, paint.inkLine)}
        x="32"
        y="94"
        width="129"
        height="69"
        strokeWidth="3"
        strokeDasharray="7 5"
      />
      <g className={cx(paint.white, paint.inkLine)} strokeWidth="2.5">
        {HANDLES.map((at) => {
          const [x, y] = at.split(' ')
          return <rect key={at} x={x} y={y} width="10" height="10" />
        })}
      </g>
      <path
        className={cx(paint.white, paint.inkLine)}
        d="M154 156l34 13-14 6-6 14z"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </>
  )
}

/** A browser extension is a puzzle piece. This one has selected its own name. */
export function PuzzlePiece({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="8 12 210 210">
      <path
        className={cx(paint.hi, paint.inkLine)}
        d={PIECE}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <Lettering lines={lines} at={NAME} />
      <Selection />
    </DieCut>
  )
}
