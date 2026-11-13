import { createElement, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import foil from './foil.module.css'
import { type Tone, toneClass } from './tones'
import styles from './Vinyl.module.css'

export type PeelCorner = 'bottomRight' | 'topLeft'

export interface VinylProps {
  /** `div` when the sticker holds paragraphs, `span` inside a link. */
  readonly as?: 'div' | 'span'
  /** The colour it is cut from. Left out, the sticker's own class decides. */
  readonly tone?: Tone
  /** Holographic foil instead of a flat colour. */
  readonly foil?: boolean
  /** A corner that is lifting off the lid. */
  readonly peel?: PeelCorner
  readonly className?: string | undefined
  readonly children: ReactNode
}

/** The skin most stickers share: a white-edged, glossy piece of coloured vinyl. */
export function Vinyl({
  as = 'span',
  tone,
  foil: holographic = false,
  peel,
  className,
  children,
}: VinylProps): ReactElement {
  const classes = cx(
    styles.vinyl,
    tone !== undefined && toneClass(tone),
    holographic && foil.foil,
    peel !== undefined && styles.peel,
    peel === 'topLeft' && styles.peelTopLeft,
    className,
  )
  return createElement(as, { className: classes }, children)
}
