import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the main part of the ticket, left of the tear line. */
const NAME = Object.freeze({ x: 110, y: 60, width: 138, max: 36 })

/** A ticket with a bite out of each end. */
const TICKET = 'M20 16H260V52a18 18 0 0 0 0 36V124H20V88a18 18 0 0 0 0-36Z'

/** A row of ticks: every test case, passed. */
const TICKS = 'M54 102l5 5 9-10M82 102l5 5 9-10M110 102l5 5 9-10M138 102l5 5 9-10M166 102l5 5 9-10'

/** A ticket stub with the verdict punched into it: accepted. */
export function Ticket({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 4 280 132">
      <path
        className={cx(paint.hi, paint.inkLine)}
        d={TICKET}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d="M196 22V118"
        strokeWidth="3"
        strokeDasharray="5 6"
      />
      <Lettering lines={[lines.join(' ')]} at={NAME} />
      <path className={cx(paint.hollow, paint.inkLine, styles.pen)} d={TICKS} strokeWidth="3.5" />
      <circle className={paint.ink} cx="222" cy="70" r="17" />
      <path
        className={cx(paint.hollow, styles.hiLine, styles.pen)}
        d="M213 70l7 7 12-14"
        strokeWidth="5.5"
      />
    </DieCut>
  )
}
