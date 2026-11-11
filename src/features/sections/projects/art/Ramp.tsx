import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the plate the ramp is bolted to. */
const NAME = Object.freeze({ x: 130, y: 161, width: 206, max: 24 })

/** The coin on its way down. */
function Coin(): ReactElement {
  return (
    <>
      <circle className={cx(paint.hi, paint.inkLine)} cx="133" cy="106" r="18" strokeWidth="4" />
      <circle
        className={cx(paint.hollow, paint.inkLine)}
        cx="133"
        cy="106"
        r="12.5"
        strokeWidth="1.8"
      />
      <path className={paint.ink} d="M136 95l-10 13h6l-3 9 10-13h-6z" />
    </>
  )
}

/** A quarter-pipe with a coin rolling down it: an on-ramp, taken literally. */
export function Ramp({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 32 260 160">
      <path
        className={cx(paint.mint, paint.inkLine)}
        d="M20 150C120 150 180 110 210 48H242V150Z"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        className={cx(paint.hollow, paint.inkLine, styles.faint)}
        d="M176 102V150M210 60V150M176 150L210 102M210 150L242 102"
        strokeWidth="3"
      />
      <Coin />
      <rect className={paint.ink} x="12" y="138" width="236" height="46" rx="12" />
      <Lettering lines={[lines.join(' ')]} at={NAME} tone={paint.hi} />
    </DieCut>
  )
}
