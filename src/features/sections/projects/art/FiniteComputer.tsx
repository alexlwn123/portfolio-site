import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import { paintRef, SHARED_IDS } from '../../../stickers/svgIds'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** The name is typed on the screen, flush left after the prompt. */
const NAME = Object.freeze({ x: 76, y: 92, width: 170, max: 40 })

/** The stand and the foot the monitor sits on. */
function Stand(): ReactElement {
  return (
    <g className={cx(paint.white, paint.inkLine)} strokeWidth="6" strokeLinejoin="round">
      <path d="M126 200h48l8 30h-64z" />
      <rect x="74" y="228" width="152" height="24" rx="12" />
    </g>
  )
}

/** The chin under the screen: three vents and a light that is on. */
function Chin(): ReactElement {
  return (
    <>
      <path
        className={cx(paint.hollow, paint.inkLine, styles.pen)}
        d="M46 188h14M68 188h14M90 188h14"
        strokeWidth="5"
      />
      <circle className={cx(paint.mint, paint.inkLine)} cx="250" cy="188" r="6" strokeWidth="3" />
    </>
  )
}

/** A chunky desktop computer with a foil case: the name is what is on its screen. */
export function FiniteComputer({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 0 300 266">
      <Stand />
      <rect
        className={paint.inkLine}
        x="18"
        y="14"
        width="264"
        height="192"
        rx="28"
        fill={paintRef(SHARED_IDS.foil)}
        strokeWidth="6"
      />
      <rect className={paint.ink} x="40" y="34" width="220" height="136" rx="14" />
      <path
        className={cx(paint.hollow, styles.mintLine, styles.pen)}
        d="M52 68l11 10-11 10"
        strokeWidth="5"
      />
      <Lettering lines={lines} at={NAME} tone={paint.hi} anchor="start" />
      <rect className={styles.cursor} x="76" y="136" width="15" height="22" rx="2" />
      <path className={styles.glare} d="M214 34h24l-34 34h-24zM246 34h8l-34 34h-8z" />
      <Chin />
    </DieCut>
  )
}
