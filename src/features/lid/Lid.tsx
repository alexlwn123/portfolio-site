import type { ReactElement } from 'react'

import type { Content, Stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { SharedDefs } from '../stickers/illustrations/SharedDefs'
import styles from './Lid.module.css'
import { LidSurface } from './LidSurface'
import { lidNotes } from './notes'
import { lidStickers } from './stickers'

interface LidProps {
  readonly content: Content
  readonly stats: Stats
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
}

/**
 * The top of the home page: the lid of a laptop that has been to every
 * hackathon, with his conference badge hanging from a lanyard. Static HTML and
 * CSS: the page loads a script that makes it move (src/features/lid/enhance),
 * and the lid is whole without it. The main landmark belongs to the page
 * (src/features/home/HomePage.tsx), which puts the sections under the lid.
 */
export function Lid({ content, stats, photo }: LidProps): ReactElement {
  return (
    <div className={styles.desk} data-lid-desk="">
      <div className={styles.lid} data-lid="">
        <SharedDefs />
        <LidSurface items={lidStickers(content, stats)} notes={lidNotes(content)} photo={photo} />
      </div>
    </div>
  )
}
