import type { ReactElement, ReactNode } from 'react'

import paint from '../../../stickers/paint.module.css'
import { paintRef, svgId } from '../../../stickers/svgIds'
import styles from './art.module.css'

interface DieCutProps {
  /** The sticker this drawing belongs to. Its filter's id is built from it. */
  readonly id: string
  readonly viewBox: string
  readonly children: ReactNode
}

/**
 * A drawing cut out as a sticker: whatever is drawn inside is given the white
 * border a die-cut leaves, grown from the drawing's own outline, as the lid's
 * crab is. A drawing: the caller names it.
 */
export function DieCut({ id, viewBox, children }: DieCutProps): ReactElement {
  const border = svgId(id, 'die-cut')

  return (
    <svg className={paint.art} viewBox={viewBox} aria-hidden="true" focusable="false">
      <defs>
        <filter id={border} x="-12%" y="-12%" width="124%" height="124%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="6" />
          <feGaussianBlur stdDeviation="1.8" />
          <feComponentTransfer result="grown">
            <feFuncA type="linear" slope="12" intercept="-5" />
          </feComponentTransfer>
          <feFlood className={styles.edge} />
          <feComposite in2="grown" operator="in" result="border" />
          <feMerge>
            <feMergeNode in="border" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={paintRef(border)}>{children}</g>
    </svg>
  )
}
