import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { projectsCopy } from './copy'
import type { WinFlagSpec } from './projectStickers'
import styles from './WinFlag.module.css'

interface WinFlagProps {
  /** The project whose win this is. Read out, not shown: the flag is planted in its sticker. */
  readonly owner: string
  readonly flag: WinFlagSpec
  /** Where it is planted. */
  readonly className?: string | undefined
}

/** A small pennant on a pin, planted in a project that won a hackathon. It leads to the wins. */
export function WinFlag({ owner, flag, className }: WinFlagProps): ReactElement {
  return (
    <Stuck href={flag.href} className={cx(styles.flag, className)}>
      <span className={styles.edge}>
        <span className={styles.cloth}>
          <span className={voice.srOnly}>{projectsCopy.flagOwner(owner)} </span>
          <span className={cx(voice.display, styles.result)}>{flag.result}</span>{' '}
          <span className={cx(voice.label, styles.event)}>{flag.event}</span>
        </span>
      </span>
    </Stuck>
  )
}
