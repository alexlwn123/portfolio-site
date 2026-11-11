import type { ReactElement, ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import voice from '../stickers/voice.module.css'
import { HeadingLabel } from './HeadingLabel'
import styles from './SectionFrame.module.css'
import { type HomeSectionId, type Surface, titleId } from './sectionIds'
import { Stuck } from './Stuck'

export interface SectionFrameProps {
  readonly id: HomeSectionId
  readonly surface: Surface
  /** The heading, shouted over two lines. An empty line is left out. */
  readonly title: readonly [string, string]
  /** A line in his handwriting under the heading. */
  readonly kicker?: string | undefined
  readonly children?: ReactNode
}

/**
 * One full-width band of the home page: a surface, a heading that is a
 * sticker, and whatever the section sticks down under it. Everything inside
 * is measured in the lid's design unit (one em is ten units), so any sticker
 * from the lid can be used here at the size it has there.
 */
export function SectionFrame(props: SectionFrameProps): ReactElement {
  const { id, surface, title, kicker, children } = props

  return (
    <section
      id={id}
      className={cx(styles.frame, styles[surface])}
      aria-labelledby={titleId(id)}
      data-section={id}
      data-surface={surface}
    >
      <div className={styles.units} data-units="">
        <header className={styles.header}>
          <h2 id={titleId(id)} className={styles.title}>
            <Stuck as="span">
              <HeadingLabel lines={title} />
            </Stuck>
          </h2>
          {kicker !== undefined && <p className={cx(voice.marker, styles.kicker)}>{kicker}</p>}
        </header>
        <div className={styles.body} data-section-body="">
          {children}
        </div>
      </div>
    </section>
  )
}
