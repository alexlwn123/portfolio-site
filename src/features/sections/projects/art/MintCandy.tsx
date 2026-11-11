import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the band across the middle of the sweet. */
const NAME = Object.freeze({ x: 140, y: 75, width: 150, max: 20 })

/** One stripe of the swirl is drawn; the others are the same stripe, turned. */
const STRIPE = 'M140 75Q152 42 140 16A59 59 0 0 1 169.5 23.9Q170 56 140 75Z'
const TURNS = ['0', '60', '120', '180', '240', '300'] as const

/** The two twisted ends of the wrapper. */
function Wrapper(): ReactElement {
  return (
    <>
      <g className={cx(paint.mint, paint.inkLine)} strokeWidth="6" strokeLinejoin="round">
        <path d="M84 75L16 30Q32 75 16 120Z" />
        <path d="M196 75L264 30Q248 75 264 120Z" />
      </g>
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d="M70 68L34 50M70 82L34 100M210 68L246 50M210 82L246 100"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  )
}

/** A wrapped peppermint: Fedimint is, after all, a mint. */
export function MintCandy({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 0 280 150">
      <Wrapper />
      <circle className={cx(paint.white, paint.inkLine)} cx="140" cy="75" r="62" strokeWidth="6" />
      {TURNS.map((turn) => (
        <path key={turn} className={paint.mint} d={STRIPE} transform={`rotate(${turn} 140 75)`} />
      ))}
      <rect
        className={cx(paint.ink, paint.whiteLine)}
        x="50"
        y="53"
        width="180"
        height="44"
        rx="22"
        strokeWidth="4"
      />
      <Lettering lines={[lines.join(' ')]} at={NAME} tone={paint.hi} />
    </DieCut>
  )
}
