import { Fragment, type ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Star } from '../stickers/illustrations/Glyphs'
import styles from './Lanyard.module.css'

interface LanyardProps {
  /** The words printed along each strap, with a star after each. */
  readonly left: readonly string[]
  readonly right: readonly string[]
}

/** Enough repeats to cover a strap with the shortest sensible loop of words. */
const REPEATS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] as const

function Strap({
  words,
  side,
}: {
  readonly words: readonly string[]
  readonly side: string | undefined
}): ReactElement {
  return (
    <span className={cx(styles.strap, side)}>
      <span className={styles.run}>
        {REPEATS.map((repeat) =>
          words.map((word) => (
            <Fragment key={`${repeat}-${word}`}>
              <span>{word}</span>
              <Star className={styles.star} />
            </Fragment>
          )),
        )}
      </span>
    </span>
  )
}

/** The straps of the lanyard. Decoration: the wrapper that places them hides them from readers. */
export function Lanyard({ left, right }: LanyardProps): ReactElement {
  return (
    <>
      <Strap words={left} side={styles.left} />
      <Strap words={right} side={styles.right} />
    </>
  )
}

export const strapsClass = styles.straps
