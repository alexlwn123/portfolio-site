import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { lidAnchor } from '../lid/anchor'
import { SECTION_IDS, sectionAnchor } from '../sections/sectionIds'
import { ArrowRight, Star } from '../stickers/illustrations/Glyphs'
import { navCopy } from './copy'
import styles from './PinnedStrap.module.css'

/**
 * The lanyard's strap laid flat across the page: the way back to the top and
 * a link to each section. It lies between the lid and the first section, and
 * stays at the top of the screen from there down. Past its last link the
 * strap is bare. The way back is a buckle at the strap's end, beside the
 * list and not in it: where the links do not all fit they scroll sideways
 * inside the list, and none of them can slide under the buckle. CSS does all
 * of it: no script knows this is here.
 */
export function PinnedStrap(): ReactElement {
  return (
    <nav className={styles.strap} aria-label={navCopy.label} data-pinned-strap="">
      <div className={cx(styles.item, styles.buckle)}>
        <a className={styles.link} href={lidAnchor()}>
          <ArrowRight className={styles.up} />
          {navCopy.top}
        </a>
      </div>
      <ul className={styles.run} role="list">
        {SECTION_IDS.map((id) => (
          <li key={id} className={styles.item}>
            <Star className={styles.star} />
            <a className={styles.link} href={sectionAnchor(id)} data-to={id}>
              {navCopy.sections[id]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
