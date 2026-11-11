import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import styles from './art.module.css'
import type { DrawingProps } from './drawing'
import { Lettering } from './Lettering'

/** On the white of the stamp, under its picture. */
const NAME = Object.freeze({ x: 100, y: 197, width: 126, max: 22 })

/** Two nodes with a bolt between them: a message, carried over Lightning. */
function Picture(): ReactElement {
  return (
    <>
      <rect
        className={cx(paint.tang, paint.inkLine)}
        x="34"
        y="34"
        width="132"
        height="138"
        strokeWidth="4"
      />
      <path
        className={cx(paint.hollow, paint.inkLine, styles.pen)}
        d="M64 136L94 100 106 116 136 76"
        strokeWidth="13"
      />
      <path
        className={cx(paint.hollow, styles.hiLine, styles.pen)}
        d="M64 136L94 100 106 116 136 76"
        strokeWidth="6"
      />
      <g className={cx(paint.white, paint.inkLine)} strokeWidth="4">
        <circle cx="64" cy="136" r="13" />
        <circle cx="136" cy="76" r="13" />
      </g>
      <g className={paint.ink}>
        <circle cx="64" cy="136" r="4.5" />
        <circle cx="136" cy="76" r="4.5" />
      </g>
    </>
  )
}

/** The wavy lines of a postmark, struck across the corner. */
function Postmark(): ReactElement {
  return (
    <path
      className={cx(paint.hollow, paint.inkLine, styles.pen)}
      d="M44 48q8-8 16 0t16 0 16 0M44 60q8-8 16 0t16 0 16 0M44 72q8-8 16 0t16 0"
      strokeWidth="3"
    />
  )
}

/**
 * A postage stamp: its perforated edge is a row of white dots along the edge
 * of the paper, so it is cut out already and needs no border grown round it.
 */
export function PostageStamp({ lines }: DrawingProps): ReactElement {
  return (
    <svg className={paint.art} viewBox="8 8 184 224" aria-hidden="true" focusable="false">
      <rect
        className={cx(paint.white, paint.whiteLine)}
        x="20"
        y="20"
        width="160"
        height="200"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray="0.1 14.9"
      />
      <Picture />
      <Postmark />
      <Lettering lines={[lines.join(' ')]} at={NAME} />
    </svg>
  )
}
