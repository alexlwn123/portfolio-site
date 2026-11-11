import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the tray the board stands in. */
const NAME = Object.freeze({ x: 110, y: 207, width: 168, max: 26 })

/** Where each peg sits: one in the top row, four in the bottom. */
const PEGS = [
  '110 66',
  '92 96',
  '128 96',
  '74 126',
  '110 126',
  '146 126',
  '56 156',
  '92 156',
  '128 156',
  '164 156',
] as const

function Peg({ at }: { readonly at: string }): ReactElement {
  const [x, y] = at.split(' ')
  return <circle className={cx(paint.white, paint.inkLine)} cx={x} cy={y} r="6" strokeWidth="3" />
}

/** The coin on its way in: it has just clipped the top of the board. */
function Coin(): ReactElement {
  return (
    <>
      <circle className={cx(paint.hi, paint.inkLine)} cx="132" cy="38" r="15" strokeWidth="4" />
      <path className={paint.ink} d="M135 27l-10 13h6l-3 9 10-13h-6z" />
    </>
  )
}

/** A plinko board, a coin dropping onto its first peg, and the name on the tray. */
export function PlinkoBoard({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 6 220 232">
      <path
        className={cx(paint.gum, paint.inkLine)}
        d="M110 14L204 176Q210 196 190 196H30Q10 196 16 176Z"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {PEGS.map((at) => (
        <Peg key={at} at={at} />
      ))}
      <Coin />
      <rect className={paint.ink} x="14" y="184" width="192" height="46" rx="14" />
      <Lettering lines={[lines.join(' ')]} at={NAME} tone={paint.hi} />
    </DieCut>
  )
}
