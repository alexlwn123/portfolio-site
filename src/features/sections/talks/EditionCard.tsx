import type { ReactElement } from 'react'

import type { BitcoinPlusPlus, Stats } from '../../../content'
import { cx } from '../../../lib/classNames'
import { LABELS } from '../../cv/labels'
import { RecordSticker } from '../../stickers/RecordSticker'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { talksCopy } from './copy'
import styles from './EditionCard.module.css'

const TITLE_ID = 'talks-bitcoin-plus-plus-title'
/** How many stamps the card takes across. */
const STAMPS_PER_ROW = 3

interface EditionCardProps {
  readonly record: BitcoinPlusPlus
  readonly stats: Stats['bitcoinPlusPlus']
}

/** The empty squares that fill out the last row: room for the next edition. */
function blanks(stamped: number): readonly string[] {
  const spare = (STAMPS_PER_ROW - (stamped % STAMPS_PER_ROW)) % STAMPS_PER_ROW
  return Array.from({ length: spare }, (_, index) => `blank-${String(index)}`)
}

/**
 * His bitcoin++ record: the lid's own record sticker, which leads to his
 * community profile, on a stamp card with one stamp for every edition he has
 * been to. Every number and every city comes from the record.
 */
export function EditionCard({ record, stats }: EditionCardProps): ReactElement {
  const { record: words } = talksCopy
  const empty = blanks(record.editions.length)

  return (
    <article className={styles.card} aria-labelledby={TITLE_ID}>
      <Stuck className={styles.sheet}>
        <Vinyl as="div" tone="white" className={styles.paper}>
          <h3 id={TITLE_ID} className={cx(voice.display, styles.name)}>
            {LABELS.bitcoinPlusPlus}
          </h3>
          <p className={cx(voice.label, styles.kind)}>
            <span>{words.card} </span>
            <span className={styles.since}>{words.since(stats.memberSince)}</span>
          </p>
          <ul className={styles.stamps} aria-label={LABELS.editionsList} role="list">
            {record.editions.map(({ city, year }) => (
              <li key={`${city}-${String(year)}`} className={styles.stamp}>
                <span className={cx(voice.label, styles.city)}>{city} </span>
                <span className={cx(voice.display, styles.when)}>{year}</span>
              </li>
            ))}
            {empty.map((key, index) => (
              <li key={key} className={styles.blank} aria-hidden="true" data-blank="">
                {index === 0 && <span className={voice.marker}>{words.next}</span>}
              </li>
            ))}
          </ul>
        </Vinyl>
      </Stuck>
      <Stuck href={record.profileUrl} className={styles.record}>
        <RecordSticker
          mark={words.mark}
          lines={[
            LABELS.bitcoinPlusPlus,
            words.editions(stats.editions),
            words.sessions(stats.stageSessions),
          ]}
        />
      </Stuck>
    </article>
  )
}
