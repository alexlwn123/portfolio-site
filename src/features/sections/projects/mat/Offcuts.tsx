import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import voice from '../../../stickers/voice.module.css'
import { type MatPlace, placeData } from '../matRows'
import styles from './mat.module.css'

interface OffcutsProps {
  /** What is scribbled on the mat beside it. */
  readonly note: string
  /** How it lies. */
  readonly className?: string | undefined
  /** Where on the mat it lies: at the end of the last row of stickers. */
  readonly place?: MatPlace | undefined
}

/** A scrap of vinyl with the shapes of a coin, a star and a bolt cut out of it. */
const SCRAP =
  'M18 52Q64 14 128 30T226 58L232 132Q168 170 96 154T14 126Z' +
  'M52 86a21 21 0 1 0 42 0a21 21 0 1 0-42 0Z' +
  'M150 60l9 20 22 3-16 15 4 22-19-11-19 11 4-22-16-15 22-3Z' +
  'M196 84l-18 26h11l-5 20 20-28h-12Z'

/** The thin strips that come away between the stickers, curling. */
const CURLS = [
  ['M8 150q26-34 54-8t52-16', 'gum'],
  ['M96 176q30-30 58-6t60-24', 'mint'],
  ['M150 22q22-22 40-2t36-10', 'white'],
] as const

/**
 * What is left when the stickers have been weeded out: a scrap with holes in
 * the shapes that were cut from it, and a few curls of vinyl. A list item, as
 * the knife is, and furniture too.
 */
export function Offcuts({ note, className, place }: OffcutsProps): ReactElement {
  return (
    <li
      className={cx(styles.prop, className)}
      aria-hidden="true"
      data-mat-prop="offcuts"
      {...placeData(place)}
    >
      <svg className={styles.offcuts} viewBox="0 0 244 196" focusable="false">
        <path className={paint.tang} d={SCRAP} fillRule="evenodd" transform="rotate(8 122 98)" />
        <path className={paint.hi} d={SCRAP} fillRule="evenodd" />
        {CURLS.map(([d, tone]) => (
          <path
            key={d}
            className={cx(paint.hollow, styles[tone])}
            d={d}
            strokeWidth="9"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <span className={cx(voice.marker, styles.note)}>{note}</span>
    </li>
  )
}
