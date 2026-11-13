import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import paint from '../paint.module.css'

const OUTLINE = 'M40 6L8 54h21l-9 36 36-52H34z'

/** A loose lightning bolt: highlighter yellow, ink line, white die-cut edge. */
export function Bolt(): ReactElement {
  return (
    <svg className={paint.art} viewBox="0 0 64 96" aria-hidden="true" focusable="false">
      <path
        className={cx(paint.white, paint.whiteLine)}
        d={OUTLINE}
        strokeWidth="13"
        strokeLinejoin="round"
      />
      <path
        className={cx(paint.hi, paint.inkLine)}
        d={OUTLINE}
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
