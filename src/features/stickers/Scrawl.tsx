import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './Scrawl.module.css'
import voice from './voice.module.css'

interface ScrawlProps {
  readonly text: string
}

/** A line in his handwriting, written straight onto the lid in highlighter. */
export function Scrawl({ text }: ScrawlProps): ReactElement {
  return <span className={cx(voice.marker, styles.scrawl)}>{text}</span>
}
