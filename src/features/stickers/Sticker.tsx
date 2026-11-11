import { createElement, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Sticker.module.css'

type StickerTag = 'div' | 'h1' | 'nav' | 'span'

/** What a sticker that is a button does to the lid. The page's script finds it by this. */
export type StickerControl = 'sound' | 'tidy' | 'tilt'

export interface StickerProps {
  /** The sticker's id. The placement stylesheet finds the element by it. */
  readonly id: string
  /** The element to use when the sticker is neither a link nor a button. */
  readonly as?: StickerTag
  /** Where the sticker leads. A sticker with an address is always a link. */
  readonly href?: string | undefined
  /**
   * What the sticker does, when it is a button. A button does nothing without
   * the page's script, so it is hidden until that script shows it.
   */
  readonly control?: StickerControl | undefined
  /** True for a button that stays on or off. It starts off. */
  readonly toggle?: boolean
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

/** The attributes only a button has. */
function buttonProps(control: StickerControl, toggle: boolean): Record<string, unknown> {
  return {
    type: 'button',
    hidden: true,
    'data-control': control,
    'aria-pressed': toggle ? 'false' : undefined,
  }
}

/**
 * The placed, shadowed thing on the lid that every sticker is. It lifts under
 * the pointer and, when it is or holds a link, under keyboard focus. A sticker
 * that is not flat can be picked up, which the page's script reads from
 * data-grab.
 */
export function Sticker({
  id,
  as = 'div',
  href,
  control,
  toggle = false,
  label,
  decorative = false,
  flat = false,
  selfSized = false,
  className,
  children,
}: StickerProps): ReactElement {
  const tag = href !== undefined ? 'a' : control !== undefined ? 'button' : as

  return createElement(
    tag,
    {
      'data-sticker': id,
      'data-grab': flat ? undefined : '',
      className: cx(
        styles.placed,
        !flat && styles.sticker,
        selfSized && styles.selfSized,
        tag === 'button' && styles.control,
        className,
      ),
      href,
      'aria-label': label,
      'aria-hidden': decorative ? true : undefined,
      ...(tag === 'button' && control !== undefined ? buttonProps(control, toggle) : {}),
    },
    children,
  )
}
