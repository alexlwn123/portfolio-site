import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** Across the body of the shield, under the pin. */
const NAME = Object.freeze({ x: 100, y: 150, width: 112, max: 24 })

const SHIELD = 'M100 12L180 38V112C180 166 140 200 100 222C60 200 20 166 20 112V38Z'
const KEYLINE = 'M100 27L167 49V112C167 157 134 187 100 206C66 187 33 157 33 112V49Z'

/** A map pin sending out a signal: where you are, shared with people you trust. */
function Beacon(): ReactElement {
  return (
    <>
      <path
        className={cx(paint.hollow, paint.inkLine, styles.pen)}
        d="M66 54q-10 15 0 30M54 46q-16 23 0 46M134 54q10 15 0 30M146 46q16 23 0 46"
        strokeWidth="4"
      />
      <path
        className={cx(paint.gum, paint.inkLine)}
        d="M100 44a22 22 0 0 1 22 22c0 15-14 26-22 40c-8-14-22-25-22-40a22 22 0 0 1 22-22Z"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle className={paint.white} cx="100" cy="66" r="8" />
    </>
  )
}

/** A shield with a beacon on it. */
export function Shield({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 0 200 234">
      <path
        className={cx(paint.hi, paint.inkLine)}
        d={SHIELD}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d={KEYLINE}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <Beacon />
      <Lettering lines={lines} at={NAME} />
    </DieCut>
  )
}
