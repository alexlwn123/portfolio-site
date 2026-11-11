import { Fragment, type ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { lidAnchor } from '../lid/anchor'
import { SECTION_IDS, sectionAnchor } from '../sections/sectionIds'
import { ArrowRight, Star } from '../stickers/illustrations/Glyphs'
import { navCopy } from './copy'
import styles from './PinnedStrap.module.css'

interface PinnedStrapProps {
  /** What is woven into the strap where it carries no link: the lanyard's own words. */
  readonly words: readonly string[]
}

/** Enough repeats of the words to run off the end of the widest screen. */
const REPEATS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth']

/** The rest of the strap, printed like the lanyard it is. Decoration: it says nothing new. */
function Weave({ words }: PinnedStrapProps): ReactElement {
  return (
    <span className={styles.weave} aria-hidden="true">
      {REPEATS.map((repeat) =>
        words.map((word) => (
          <Fragment key={`${repeat}-${word}`}>
            <Star className={styles.star} />
            <span>{word}</span>
          </Fragment>
        )),
      )}
    </span>
  )
}

/**
 * The lanyard's strap laid flat across the page: the way back to the top and
 * a link to each section. It lies between the lid and the first section, and
 * stays at the top of the screen from there down. CSS does all of it: no
 * script knows this is here.
 */
export function PinnedStrap({ words }: PinnedStrapProps): ReactElement {
  return (
    <nav className={styles.strap} aria-label={navCopy.label} data-pinned-strap="">
      <ul className={styles.run} role="list">
        <li className={cx(styles.item, styles.buckle)}>
          <a className={styles.link} href={lidAnchor()}>
            <ArrowRight className={styles.up} />
            {navCopy.top}
          </a>
        </li>
        {SECTION_IDS.map((id) => (
          <li key={id} className={styles.item}>
            <Star className={styles.star} />
            <a className={styles.link} href={sectionAnchor(id)} data-to={id}>
              {navCopy.sections[id]}
            </a>
          </li>
        ))}
      </ul>
      <Weave words={words} />
    </nav>
  )
}
