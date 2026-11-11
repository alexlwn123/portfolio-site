import type { ReactElement } from 'react'

import type { BadgePhotoImage } from '../badge/photoSources'
import styles from './Lid.module.css'
import type { LidItem, NoteSpec } from './stickerSpecs'
import { StickerView } from './stickerViews'

interface LidSurfaceProps {
  /** The stickers, in reading order. The markup follows this order exactly. */
  readonly items: readonly LidItem[]
  /** What is stuck underneath a sticker, by the sticker's id. */
  readonly notes: Readonly<Partial<Record<string, NoteSpec>>>
  readonly photo: BadgePhotoImage
}

/** Scratches on the anodised lid, drawn across the desktop artboard. */
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

/**
 * The surface the stickers are stuck to. It only lists them: where each one
 * lands is the placement stylesheet's business.
 */
export function LidSurface({ items, notes, photo }: LidSurfaceProps): ReactElement {
  return (
    <div className={styles.stage} data-lid-stage="">
      <Scuffs />
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
    </div>
  )
}
