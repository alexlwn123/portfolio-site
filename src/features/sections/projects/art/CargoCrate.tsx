import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** Stencilled across the planks, between the two end boards. */
const NAME = Object.freeze({ x: 120, y: 102, width: 140, max: 34 })

/** The boards nailed across each end, with a "this way up" arrow on each. */
function EndBoards(): ReactElement {
  return (
    <>
      <g className={cx(styles.tangLight, paint.inkLine)} strokeWidth="4">
        <rect x="18" y="36" width="26" height="152" />
        <rect x="196" y="36" width="26" height="152" />
      </g>
      <path
        className={cx(paint.hollow, paint.inkLine, styles.pen)}
        d="M31 84V58M23 66l8-9 8 9M209 84V58M201 66l8-9 8 9"
        strokeWidth="4"
      />
      <g className={paint.ink}>
        <circle cx="31" cy="46" r="2.6" />
        <circle cx="31" cy="178" r="2.6" />
        <circle cx="209" cy="46" r="2.6" />
        <circle cx="209" cy="178" r="2.6" />
      </g>
    </>
  )
}

/** A podium of three, stencilled under the name: this crate is a leaderboard. */
function Podium(): ReactElement {
  return (
    <g className={cx(paint.white, paint.inkLine)} strokeWidth="3" strokeLinejoin="round">
      <rect x="94" y="160" width="17" height="16" />
      <rect x="111" y="150" width="18" height="26" />
      <rect x="129" y="166" width="17" height="10" />
    </g>
  )
}

/** A shipping crate, stencilled with the name. Cargo is how Rust builds. */
export function CargoCrate({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 6 240 198">
      <rect
        className={cx(paint.tang, paint.inkLine)}
        x="18"
        y="34"
        width="204"
        height="156"
        rx="8"
        strokeWidth="6"
      />
      <path
        className={cx(paint.hollow, paint.inkLine, styles.faint)}
        d="M44 70h152M44 134h152"
        strokeWidth="3"
      />
      <EndBoards />
      <rect
        className={cx(styles.tangLight, paint.inkLine)}
        x="10"
        y="18"
        width="220"
        height="24"
        rx="7"
        strokeWidth="6"
      />
      <Lettering lines={lines} at={NAME} />
      <Podium />
    </DieCut>
  )
}
