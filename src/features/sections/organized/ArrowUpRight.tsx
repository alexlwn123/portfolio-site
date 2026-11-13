import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import glyphs from '../../stickers/illustrations/glyphs.module.css'

interface ArrowUpRightProps {
  readonly className?: string | undefined
}

/** The arrow on a link that leaves the site. Drawn: the typefaces have none. */
export function ArrowUpRight({ className }: ArrowUpRightProps): ReactElement {
  return (
    <svg
      className={cx(glyphs.glyph, glyphs.stroked, className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 18L18 6M8 6h10v10" strokeWidth="3.2" />
    </svg>
  )
}
