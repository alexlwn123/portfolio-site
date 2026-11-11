import { createElement, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Sticker.module.css'

type StickerTag = 'div' | 'h1' | 'nav' | 'span'

export interface StickerProps {
  /** The sticker's id. The placement stylesheet finds the element by it. */
  readonly id: string
  /** The element to use when the sticker is not a link. */
  readonly as?: StickerTag
  /** Where the sticker leads. A sticker with an address is always a link. */
  readonly href?: string | undefined
  /** An accessible name, for a sticker whose face is a drawing. */
  readonly label?: string | undefined
  /** True for a sticker drawn for the eye only. */
  readonly decorative?: boolean
  /** True for something drawn straight onto the lid: no shadow, no lift, no slap. */
  readonly flat?: boolean
  /** True when the placement gives no width and the sticker sizes itself. */
  readonly selfSized?: boolean
  readonly className?: string | undefined
  readonly children: ReactNode
}

/**
 * The placed, shadowed thing on the lid that every sticker is. It lifts under
 * the pointer and, when it is or holds a link, under keyboard focus.
 */
export function Sticker({
  id,
  as = 'div',
  href,
  label,
  decorative = false,
  flat = false,
  selfSized = false,
  className,
  children,
}: StickerProps): ReactElement {
  return createElement(
    href === undefined ? as : 'a',
    {
      'data-sticker': id,
      className: cx(
        styles.placed,
        !flat && styles.sticker,
        selfSized && styles.selfSized,
        className,
      ),
      href,
      'aria-label': label,
      'aria-hidden': decorative ? true : undefined,
    },
    children,
  )
}
