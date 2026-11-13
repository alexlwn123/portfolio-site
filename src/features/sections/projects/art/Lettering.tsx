import type { ReactElement } from 'react'

import { cx } from '../../../../lib/classNames'
import paint from '../../../stickers/paint.module.css'
import voice from '../../../stickers/voice.module.css'
import { type LetteringBlock, setLines } from './fitLines'

interface LetteringProps {
  /** The name, one line to an item. */
  readonly lines: readonly string[]
  /** Where the lettering goes and how much room it has. */
  readonly at: LetteringBlock
  /** The colour class. Ink when left out. */
  readonly tone?: string | undefined
  /** Centred on the block's x, or starting from it. */
  readonly anchor?: 'middle' | 'start'
}

/**
 * A project's name lettered on its sticker in the display face, each line as
 * large as fits. A line ends in a space, which shows nowhere but keeps the
 * words apart when the drawing's text is read or copied.
 */
export function Lettering({
  lines,
  at,
  tone = paint.ink,
  anchor = 'middle',
}: LetteringProps): ReactElement {
  return (
    <>
      {setLines(lines, at).map(({ text, size, baseline }) => (
        <text
          key={text}
          className={cx(voice.display, tone)}
          x={at.x}
          y={baseline}
          fontSize={size}
          textAnchor={anchor}
        >
          {text}{' '}
        </text>
      ))}
    </>
  )
}
