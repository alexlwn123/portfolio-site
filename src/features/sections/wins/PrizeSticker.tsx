import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import foil from '../../stickers/foil.module.css'
import voice from '../../stickers/voice.module.css'
import styles from './PrizeSticker.module.css'
import type { StickerLook, StickerShape } from './stickerLooks'
import type { WinFacts } from './winFacts'

interface PrizeStickerProps {
  readonly win: Pick<WinFacts, 'rank' | 'finish' | 'sticker'>
  readonly look: StickerLook
}

/**
 * One prize sticker, still on the sheet: the kiss-cut line round it, its
 * white border, and a face cut from the finish its result earns. A first is
 * holographic foil, a second is brushed silver, and a prize that was not a
 * place has a shape and a colour of its own. A drawing: the entry beside it
 * prints the same facts as text.
 */
export function PrizeSticker({ win, look }: PrizeStickerProps): ReactElement {
  const { rank, finish, sticker } = win

  return (
    <span
      className={cx(
        styles.sticker,
        styles[look.shape],
        styles[finish],
        look.lifting && styles.lifting,
      )}
      data-prize={look.shape}
      data-finish={finish}
      aria-hidden="true"
    >
      <span className={styles.cut} />
      <span className={styles.vinyl}>
        <span className={cx(styles.face, finish === 'first' && foil.foil)}>
          <span className={cx(voice.display, styles.rank)}>{rank}</span>{' '}
          {sticker.field !== null && (
            <span className={cx(voice.label, styles.field)}>{sticker.field} </span>
          )}
          <span className={cx(voice.label, styles.name)}>{sticker.name}</span>{' '}
          <span className={cx(voice.label, styles.event)}>
            {sticker.event} <span className={styles.year}>{sticker.year}</span>
          </span>
        </span>
      </span>
    </span>
  )
}

interface EmptySlotProps {
  /** The shape of the sticker that was here. */
  readonly shape: StickerShape
  /** What he wrote in the gap. */
  readonly note: string
}

/**
 * The outline a sticker leaves on the sheet once it has been peeled off:
 * the kiss-cut line, the bare backing inside it, and his note about where
 * the sticker went.
 */
export function EmptySlot({ shape, note }: EmptySlotProps): ReactElement {
  return (
    <span
      className={cx(styles.sticker, styles[shape], styles.empty)}
      data-prize={shape}
      data-peeled=""
    >
      <span className={styles.cut} aria-hidden="true" />
      <span className={cx(voice.marker, styles.gone)}>{note}</span>
    </span>
  )
}
