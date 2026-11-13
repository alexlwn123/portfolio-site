import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { linkTo } from '../../lib/linkTo'
import styles from './Note.module.css'
import voice from './voice.module.css'

interface NoteLink {
  readonly label: string
  readonly href: string
}

export interface NoteProps {
  /** The id the peel control points at. */
  readonly id: string
  /** What the note is about. Read out with each link, so "Code" is never ambiguous. */
  readonly title: string
  /** One sentence to a line. */
  readonly lines: readonly string[]
  readonly links: readonly NoteLink[]
}

/**
 * The slip of paper stuck under a sticker, in his own hand. It is in the page
 * from the start: tucked out of sight until the sticker is peeled back or,
 * without the page's script, until one of its links takes keyboard focus.
 */
export function Note({ id, title, lines, links }: NoteProps): ReactElement {
  return (
    <div id={id} className={cx(voice.marker, styles.note)} data-note="">
      <p className={styles.title}>{title}</p>
      {lines.map((line) => (
        <p key={line} className={styles.line}>
          {line}
        </p>
      ))}
      <ul className={styles.links} role="list">
        {links.map(({ label, href }) => (
          <li key={href}>
            <a className={styles.link} {...linkTo(href)}>
              {label}
              <span className={voice.srOnly}>: {title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
