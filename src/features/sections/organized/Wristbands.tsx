import type { ReactElement } from 'react'

import type { Organized } from '../../../content'
import { cx } from '../../../lib/classNames'
import { ArrowDown } from '../../stickers/illustrations/Glyphs'
import voice from '../../stickers/voice.module.css'
import { bandLook } from './bandLooks'
import { organizedCopy } from './copy'
import { EventBand } from './EventBand'
import type { EventLabel } from './eventLabels'
import { EventNote } from './EventNote'
import styles from './Wristbands.module.css'

interface WristbandsProps {
  /** The hackathons, newest first. */
  readonly events: readonly Organized[]
  /** The label for each, in the same order. */
  readonly labels: readonly EventLabel[]
}

/** The side of the arm a row's label is lettered on. The first is on the right. */
function sideOf(index: number): 'left' | 'right' {
  return index % 2 === 0 ? 'right' : 'left'
}

/**
 * The forearm and everything on it: one wristband per hackathon, newest at
 * the wrist, each with its label lettered on the lid beside it. An ordered
 * list that counts down, so the last row is the first hackathon he ran.
 */
export function Wristbands({ events, labels }: WristbandsProps): ReactElement {
  return (
    <div className={styles.arm}>
      <div className={styles.forearm} data-forearm="" aria-hidden="true">
        <span className={styles.skin} />
      </div>
      <ol className={styles.rows} role="list" reversed aria-label={organizedCopy.listLabel}>
        {labels.map((label, index) => {
          const event = events[index]
          const side = sideOf(index)
          return (
            <li
              key={label.id}
              className={cx(styles.row, styles[side], label.upcoming && styles.upcoming)}
              data-side={side}
            >
              <div className={styles.wrist}>
                {event !== undefined && (
                  <EventBand
                    number={label.number}
                    name={label.name}
                    look={bandLook(event, index)}
                  />
                )}
              </div>
              <div className={styles.label}>
                <EventNote label={label} />
              </div>
            </li>
          )
        })}
      </ol>
      <p className={cx(voice.marker, styles.tattoo)}>
        {organizedCopy.roomForMore}
        <ArrowDown className={styles.arrow} />
      </p>
    </div>
  )
}
