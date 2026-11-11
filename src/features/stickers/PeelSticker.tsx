import type { ReactElement, ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import { Note, type NoteProps } from './Note'
import styles from './PeelSticker.module.css'
import sticker from './Sticker.module.css'
import { svgId } from './svgIds'

/** Where the corner that peels sits: on the box's own corner, or in from it on a round drawing. */
export type PeelShape = 'card' | 'round'

export interface PeelStickerProps {
  /** The sticker's id. The placement stylesheet finds the element by it. */
  readonly id: string
  /** Where the sticker's face leads. */
  readonly href: string
  /** An accessible name for the face, when it is a drawing. */
  readonly label?: string | undefined
  /** The accessible name of the control that peels the sticker back. */
  readonly peelLabel: string
  readonly shape?: PeelShape
  /** What is stuck underneath. */
  readonly note: Omit<NoteProps, 'id'>
  readonly children: ReactNode
}

/**
 * A sticker with a note stuck underneath it. The face is still a link. Beside
 * it is the corner that peels, a button the page's script shows and works, and
 * then the note: so the Tab key goes from the face to the corner to the note's
 * own links.
 */
export function PeelSticker({
  id,
  href,
  label,
  peelLabel,
  shape = 'card',
  note,
  children,
}: PeelStickerProps): ReactElement {
  const noteId = svgId(id, 'note')

  return (
    <div
      data-sticker={id}
      data-grab=""
      data-peelable=""
      className={cx(
        sticker.placed,
        sticker.sticker,
        styles.peelable,
        shape === 'round' && styles.round,
      )}
    >
      <span className={styles.flap}>
        <a className={styles.face} href={href} aria-label={label}>
          {children}
        </a>
        <button
          type="button"
          hidden
          className={styles.tab}
          data-peel-tab=""
          aria-expanded="false"
          aria-controls={noteId}
          aria-label={peelLabel}
        />
      </span>
      <Note id={noteId} {...note} />
    </div>
  )
}
