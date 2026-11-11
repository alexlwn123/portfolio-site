import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './HelloTag.module.css'
import { Vinyl } from './Vinyl'
import voice from './voice.module.css'

interface HelloTagProps {
  readonly greeting: string
  /** The printed lead-in the handwriting completes: "I'm a". */
  readonly lead: string
  readonly text: string
  /** A word of `text` to run the highlighter over, the first time it appears. */
  readonly highlight: string
}

/** Splits text around the first appearance of a word. The word is null when it is not there. */
function around(text: string, word: string): readonly [string, string | null, string] {
  const at = word === '' ? -1 : text.indexOf(word)
  return at < 0 ? [text, null, ''] : [text.slice(0, at), word, text.slice(at + word.length)]
}

export function HelloTag({ greeting, lead, text, highlight }: HelloTagProps): ReactElement {
  const [before, marked, after] = around(text, highlight)

  return (
    <Vinyl as="div" peel="bottomRight">
      <p className={styles.intro}>
        <span className={styles.top}>
          <span className={cx(voice.display, styles.greeting)}>{greeting}</span>{' '}
          <span className={cx(voice.label, styles.lead)}>{lead}</span>
        </span>{' '}
        <span className={cx(voice.marker, styles.text)}>
          {before}
          {marked !== null && <mark className={styles.highlight}>{marked}</mark>}
          {after}
        </span>
      </p>
    </Vinyl>
  )
}
