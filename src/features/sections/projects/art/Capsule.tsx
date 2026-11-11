import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import { DieCut } from './DieCut'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** Along the capsule, across both halves. */
const NAME = Object.freeze({ x: 140, y: 65, width: 212, max: 31 })

/** A two-tone capsule with the name printed along it. */
export function Capsule({ id, lines }: DrawingProps): ReactElement {
  return (
    <DieCut id={id} viewBox="0 8 280 114">
      <rect className={paint.white} x="14" y="22" width="252" height="86" rx="43" />
      <path className={paint.gum} d="M140 22H57a43 43 0 0 0 0 86H140Z" />
      <path className={cx(paint.hollow, paint.inkLine)} d="M140 22V108" strokeWidth="3" />
      <rect
        className={cx(paint.hollow, paint.inkLine)}
        x="14"
        y="22"
        width="252"
        height="86"
        rx="43"
        strokeWidth="6"
      />
      <path
        className={cx(paint.hollow, paint.whiteLine, styles.pen, styles.faint)}
        d="M36 50q6-14 22-17M214 98h20"
        strokeWidth="5"
      />
      <Lettering lines={[lines.join(' ')]} at={NAME} />
    </DieCut>
  )
}
