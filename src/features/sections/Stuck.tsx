import { createElement, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Stuck.module.css'

type StuckTag = 'article' | 'div' | 'li' | 'p' | 'span'

export interface StuckProps {
  /** The element to use when the sticker is not a link. */
  readonly as?: StuckTag
  /** Where the sticker leads. A sticker with an address is always a link. */
  readonly href?: string | undefined
  /** An accessible name, for a sticker whose face is a drawing. */
  readonly label?: string | undefined
  /** Where and how it sits: its place in a grid, its tilt. */
  readonly className?: string | undefined
  readonly children: ReactNode
}

/**
 * A sticker stuck down in the flow of a section. It is the lid's Sticker
 * without the placement: the section's own layout says where it goes, and
 * this gives it the shadow, and the lift when it is a link.
 */
export function Stuck({ as = 'div', href, label, className, children }: StuckProps): ReactElement {
  const linked = href !== undefined

  return createElement(
    linked ? 'a' : as,
    {
      className: cx(styles.stuck, linked && styles.lifts, className),
      href,
      'aria-label': label,
    },
    children,
  )
}
