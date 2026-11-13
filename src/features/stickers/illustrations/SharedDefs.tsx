import type { ReactElement } from 'react'

import { FOIL_REST, foilGradientTransform } from '../geometry/foil'
import { SHARED_IDS } from '../svgIds'
import styles from './SharedDefs.module.css'

/**
 * The SVG definitions more than one drawing uses, made once for the page:
 * the foil gradient and the photo's gradient map.
 */
export function SharedDefs(): ReactElement {
  return (
    <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {/* Luminance, then cobalt in the shadows, bubblegum and highlighter above. */}
        <filter id={SHARED_IDS.tritone} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values=".3 .55 .15 0 0  .3 .55 .15 0 0  .3 .55 .15 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.07 0.17 1.00 1.00 0.95" />
            <feFuncG type="table" tableValues="0.07 0.21 0.31 0.80 1.00" />
            <feFuncB type="table" tableValues="0.40 0.96 0.64 0.32 0.40" />
          </feComponentTransfer>
        </filter>
        <linearGradient
          id={SHARED_IDS.foil}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="250"
          y2="120"
          spreadMethod="reflect"
          gradientTransform={foilGradientTransform(FOIL_REST)}
        >
          <stop offset="0" className={styles.holo1} />
          <stop offset=".2" className={styles.holo2} />
          <stop offset=".4" className={styles.holo3} />
          <stop offset=".6" className={styles.holo4} />
          <stop offset=".8" className={styles.holo5} />
          <stop offset="1" className={styles.holo1} />
        </linearGradient>
      </defs>
    </svg>
  )
}
