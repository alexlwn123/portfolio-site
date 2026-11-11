import type { ReactElement } from 'react'

import type { Link } from '../../../../content'
import { cx } from '../../../../lib/classNames'
import { ArrowRight } from '../../../stickers/illustrations/Glyphs'
import voice from '../../../stickers/voice.module.css'
import { Stuck } from '../../Stuck'
import styles from './LinkChips.module.css'

interface LinkChipsProps {
  readonly links: readonly Link[]
  /** What the links belong to. Read out with each label, so "Code" is never ambiguous. */
  readonly context: string
  /** Where the row sits. */
  readonly className?: string | undefined
}

/**
 * A record's links, each a strip from a label maker with an arrow that points
 * off the page. Renders nothing when there are none.
 */
export function LinkChips({ links, context, className }: LinkChipsProps): ReactElement | null {
  if (links.length === 0) {
    return null
  }

  return (
    <ul className={cx(styles.chips, className)} role="list">
      {links.map(({ label, url }) => (
        <li key={url} className={styles.item}>
          <Stuck href={url} className={styles.chip}>
            <span className={cx(voice.label, styles.face)}>
              <span>
                {label}
                <span className={voice.srOnly}>: {context}</span>
              </span>
              <ArrowRight className={styles.arrow} />
            </span>
          </Stuck>
        </li>
      ))}
    </ul>
  )
}
