import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { FOIL_NUMBER, foilNumberBox } from '../../stickers/geometry/foilNumber'
import paint from '../../stickers/paint.module.css'
import { fragment, paintRef, SHARED_IDS, svgId } from '../../stickers/svgIds'
import voice from '../../stickers/voice.module.css'
import styles from './FoilNumber.module.css'

interface FoilNumberProps {
  /** What the drawing belongs to. Its id is built from it. */
  readonly id: string
  /** The number, as it is to be printed. */
  readonly figure: string
}

/**
 * A number die-cut from holographic foil: four copies of the same figure,
 * for the white cut, the ink shadow, the ink edge and the foil. A drawing:
 * the caller says the number in words.
 */
export function FoilNumber({ id, figure }: FoilNumberProps): ReactElement {
  const { width, height, centre } = foilNumberBox(figure)
  const letters = svgId(id, 'figure')
  const drawn = fragment(letters)

  return (
    <svg
      className={cx(paint.art, styles.number)}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <text
          id={letters}
          className={voice.display}
          x={centre}
          y={FOIL_NUMBER.baseline}
          fontSize={FOIL_NUMBER.size}
          letterSpacing={FOIL_NUMBER.tracking}
          textAnchor="middle"
        >
          {figure}
        </text>
      </defs>
      <use href={drawn} className={styles.cut} transform="translate(3 4)" />
      <use href={drawn} className={styles.edge} transform="translate(7 8)" />
      <use href={drawn} className={styles.edge} />
      <use href={drawn} fill={paintRef(SHARED_IDS.foil)} />
    </svg>
  )
}
