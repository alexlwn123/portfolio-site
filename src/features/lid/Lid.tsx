import type { ReactElement } from 'react'

import type { Content, Stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { SharedDefs } from '../stickers/illustrations/SharedDefs'
import styles from './Lid.module.css'
import { LidSurface } from './LidSurface'
import { lidStickers } from './stickers'

interface LidProps {
  readonly content: Content
  readonly stats: Stats
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
}

/**
 * The home page: the lid of a laptop that has been to every hackathon, with
 * his conference badge hanging from a lanyard. Static HTML and CSS only.
 */
export function Lid({ content, stats, photo }: LidProps): ReactElement {
  return (
    <main className={styles.desk} data-lid-desk="">
      <div className={styles.lid} data-lid="">
        <SharedDefs />
        <LidSurface items={lidStickers(content, stats)} photo={photo} />
      </div>
    </main>
  )
}
