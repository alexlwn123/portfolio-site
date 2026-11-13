import type { ReactElement } from 'react'

import type { BadgePhotoImage } from '../badge/photoSources'
import { PILE_ID, PILE_TITLE_ID } from './anchor'
import styles from './Lid.module.css'
import type { LidItem, NoteSpec } from './stickerSpecs'
import { StickerView } from './stickerViews'

type Notes = Readonly<Partial<Record<string, NoteSpec>>>

interface LidSurfaceProps {
  /** The first screen's stickers, in reading order. */
  readonly cover: readonly LidItem[]
  /** Every other sticker, in reading order. The markup follows both orders exactly. */
  readonly pile: readonly LidItem[]
  /** What is stuck underneath a sticker, by the sticker's id. */
  readonly notes: Notes
  readonly photo: BadgePhotoImage
}

interface StickersProps {
  readonly items: readonly LidItem[]
  readonly notes: Notes
  readonly photo: BadgePhotoImage
}

/** Scratches on the anodised lid, drawn across the whole of it. */
function Scuffs(): ReactElement {
  return (
    <svg
      className={styles.scuffs}
      viewBox="0 0 728 1300"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M690 420l24 70M700 430l10 34" strokeWidth="1" />
      <path d="M470 720q30-16 70-12" strokeWidth="1.2" />
      <path d="M14 1010l60 26M30 1004l30 14" strokeWidth=".9" />
      <path d="M330 1090l90-18" strokeWidth="1" />
      <path d="M520 20l40 60" strokeWidth=".8" />
    </svg>
  )
}

/** Stickers in the order given. Where each one lands is the placement stylesheet's business. */
function Stickers({ items, notes, photo }: StickersProps): ReactElement {
  return (
    <>
      {items.map((item) =>
        item.kind === 'group' ? (
          <ul key={item.key} className={styles.group} aria-label={item.label} role="list">
            {item.stickers.map((spec) => (
              <li key={spec.id} className={styles.slot}>
                <StickerView spec={spec} photo={photo} note={notes[spec.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <StickerView key={item.id} spec={item} photo={photo} note={notes[item.id]} />
        ),
      )}
    </>
  )
}

/**
 * The surface the stickers are stuck to, in its two parts. The cover is the
 * first screen: its stickers are placed against the page's column, which the
 * board is. The pile is the rest, under a heading of its own.
 */
export function LidSurface({ cover, pile, notes, photo }: LidSurfaceProps): ReactElement {
  return (
    <div className={styles.stage} data-lid-stage="">
      <Scuffs />
      <div className={styles.cover} data-lid-cover="">
        <div className={styles.board} data-lid-board="">
          <Stickers items={cover} notes={notes} photo={photo} />
        </div>
      </div>
      <section
        id={PILE_ID}
        className={styles.pile}
        aria-labelledby={PILE_TITLE_ID}
        data-lid-pile=""
      >
        <Stickers items={pile} notes={notes} photo={photo} />
      </section>
    </div>
  )
}
