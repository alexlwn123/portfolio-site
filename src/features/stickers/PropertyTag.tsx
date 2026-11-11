import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import metal from './metal.module.css'
import styles from './PropertyTag.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

/**
 * How the tag is made. A plate is brushed metal with a barcode down its side,
 * a label is white paper with an ink header and a hazard stripe along its
 * foot, and a strip is a narrow band of metal riveted at both ends.
 */
export type PropertyTagCut = 'plate' | 'label' | 'strip'

interface PropertyTagProps {
  /** The line over the name: "Property of". */
  readonly kicker: string
  /** Whose property the laptop was. */
  readonly organization: string
  /** The small print under the name, such as "Issued 2024", or null for none. */
  readonly issued: string | null
  readonly cut: PropertyTagCut
}

/**
 * An asset tag of the kind an employer sticks on a laptop and nobody peels
 * off. Each line ends in a space, which shows nowhere but keeps the words
 * apart when the tag is read out or copied.
 */
export function PropertyTag({ kicker, organization, issued, cut }: PropertyTagProps): ReactElement {
  return (
    <Vinyl className={cx(cut !== 'label' && metal.brushed, styles.tag, styles[cut])}>
      <span className={styles.words}>
        <span className={cx(voice.label, styles.kicker)} data-line="">
          {kicker}{' '}
        </span>
        <span className={styles.organization} data-line="">
          {organization}{' '}
        </span>
        {issued !== null && (
          <span className={cx(voice.label, styles.issued)} data-line="">
            {issued}
          </span>
        )}
      </span>
      {cut === 'plate' && <span className={styles.bars} aria-hidden="true" />}
    </Vinyl>
  )
}
