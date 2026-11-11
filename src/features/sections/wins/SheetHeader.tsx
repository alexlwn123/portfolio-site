import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import foil from '../../stickers/foil.module.css'
import voice from '../../stickers/voice.module.css'
import { winsCopy } from './copy'
import styles from './SheetHeader.module.css'
import type { TallyEntry } from './winFacts'

interface SheetHeaderProps {
  /** How many stickers the set has. */
  readonly total: number
  /** How many of each result, and so of each finish. */
  readonly tally: readonly TallyEntry[]
  /** The years the set runs from and to. Null when it is empty. */
  readonly span: { readonly from: number; readonly to: number } | null
}

const SEPARATOR = ' · '

/**
 * The strip a sticker shop prints across the top of a sheet: the name of the
 * set, how many pieces, a key to the finishes that doubles as the tally, a
 * barcode, and the hole it hung from.
 */
export function SheetHeader({ total, tally, span }: SheetHeaderProps): ReactElement {
  const { sheet } = winsCopy
  const make = [
    sheet.make,
    sheet.pieces(total),
    ...(span === null ? [] : [sheet.series(span.from, span.to)]),
  ]

  return (
    <div className={styles.strip} data-strip="">
      <span className={styles.hole} data-hang-hole="" aria-hidden="true" />
      <div className={styles.set}>
        <p className={cx(voice.display, styles.name)}>{sheet.name}</p>
        <p className={styles.edition}>{sheet.edition}</p>
      </div>
      <ul className={styles.tally} role="list" aria-label={sheet.tallyLabel}>
        {tally.map(({ finish, label }) => (
          <li key={finish} className={cx(voice.label, styles.count)} data-finish={finish}>
            <span
              className={cx(styles.swatch, styles[finish], finish === 'first' && foil.foil)}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
      <div className={styles.code}>
        <span className={styles.barcode} data-barcode="" aria-hidden="true" />
        <p className={cx(voice.label, styles.make)}>{make.join(SEPARATOR)}</p>
      </div>
    </div>
  )
}
