import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { organizedCopy } from './copy'
import { FoilNumber } from './FoilNumber'
import type { OrganizedTotals, TotalTile } from './organizedTotals'
import styles from './Totals.module.css'

interface TotalsProps {
  readonly totals: OrganizedTotals
}

const COUNT_ID = 'organized-count'
const SEPARATOR = ', '

interface TileProps {
  readonly total: TotalTile
  readonly name: 'participants' | 'prizes'
}

/** A sum, the word for it, and the events it is a sum of. */
function Tile({ total, name }: TileProps): ReactElement {
  const foiled = name === 'prizes'

  return (
    <li className={cx(styles.total, styles[name])} data-total={name}>
      <Stuck>
        <Vinyl
          className={styles.tile}
          {...(foiled ? { foil: true, peel: 'bottomRight' } : { tone: 'tang' })}
        >
          <span className={cx(voice.display, styles.figure)}>{total.figure}</span>{' '}
          <span className={cx(voice.label, styles.unit)}>{total.label}</span>{' '}
          <span className={styles.footnote}>{total.footnote}</span>
        </Vinyl>
      </Stuck>
    </li>
  )
}

/**
 * The totals that sit with the section's heading: the count, die-cut and
 * holographic, the countries, and the two sums on tiles of their own.
 */
export function Totals({ totals }: TotalsProps): ReactElement {
  const { count, countries, participants, prizes } = totals

  return (
    <ul className={styles.totals} role="list" aria-label={organizedCopy.totalsLabel}>
      <li className={cx(styles.total, styles.count)} data-total="count">
        <Stuck>
          <FoilNumber id={COUNT_ID} figure={count.figure} />
        </Stuck>
        <span className={voice.srOnly}>{count.summary}</span>
      </li>
      <li className={cx(styles.total, styles.countries)} data-total="countries">
        <Stuck as="span" className={styles.pill}>
          <span className={cx(voice.label, styles.pillFace)}>{countries.label}</span>
        </Stuck>{' '}
        <span className={cx(voice.marker, styles.names)}>
          <span className={voice.srOnly}>{organizedCopy.countriesList}: </span>
          {countries.names.join(SEPARATOR)}
        </span>
      </li>
      <Tile total={participants} name="participants" />
      <Tile total={prizes} name="prizes" />
    </ul>
  )
}
