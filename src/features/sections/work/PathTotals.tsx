import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import metal from '../../stickers/metal.module.css'
import { type Tone, toneClass } from '../../stickers/tones'
import voice from '../../stickers/voice.module.css'
import { sectionAnchor } from '../sectionIds'
import { Stuck } from '../Stuck'
import { workCopy } from './copy'
import { plural } from './describe'
import styles from './PathTotals.module.css'
import type { PathTotal } from './totals'

const LABEL_ID = 'work-totals-label'

/** The colour each figure's sticker is cut from. Patents are stamped in metal instead. */
const TONES: Readonly<Record<PathTotal['kind'], Tone | null>> = Object.freeze({
  wins: 'tang',
  organized: 'mint',
  stage: 'gum',
  projects: 'hi',
  patents: null,
})

interface PathTotalsProps {
  readonly totals: readonly PathTotal[]
}

/** Where the career stands today: a round sticker for each figure, each a link to its section. */
export function PathTotals({ totals }: PathTotalsProps): ReactElement | null {
  if (totals.length === 0) {
    return null
  }

  return (
    <div className={styles.totals} data-totals="">
      <p id={LABEL_ID} className={cx(voice.marker, styles.label)}>
        {workCopy.totals.label}
      </p>
      <ul className={styles.list} role="list" aria-labelledby={LABEL_ID}>
        {totals.map(({ kind, count, section }) => {
          const tone = TONES[kind]
          return (
            <li key={kind} className={styles.item} data-total={kind}>
              <Stuck href={sectionAnchor(section)}>
                <span className={cx(styles.dot, tone === null ? metal.brushed : toneClass(tone))}>
                  <span className={cx(voice.display, styles.figure)} data-figure="">
                    {count}
                  </span>{' '}
                  <span className={cx(voice.label, styles.unit)}>
                    {plural(count, workCopy.totals[kind])}
                  </span>
                </span>
              </Stuck>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
