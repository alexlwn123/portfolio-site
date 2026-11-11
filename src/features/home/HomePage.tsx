import type { ReactElement } from 'react'

import type { Content, Stats } from '../../content'
import { copy } from '../../content/copy'
import type { BadgePhotoImage } from '../badge/photoSources'
import { siteHost } from '../lid/facts'
import { Lid } from '../lid/Lid'
import { PinnedStrap } from '../nav/PinnedStrap'
import { Sections } from '../sections/Sections'
import styles from './HomePage.module.css'

interface HomePageProps {
  readonly content: Content
  readonly stats: Stats
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
}

/**
 * The home page: the lid first, then the career in full, section by section,
 * with the lanyard's strap laid between them and pinned to the top of the
 * screen from there down. Static HTML and CSS. The page loads one script that
 * makes the lid move, and everything here is whole without it.
 */
export function HomePage({ content, stats, photo }: HomePageProps): ReactElement {
  /* The strap is printed with what the lanyard's own strap says. */
  const woven = [siteHost(content.profile.site), copy.lid.lanyard.city]

  return (
    <main className={styles.page}>
      <Lid content={content} stats={stats} photo={photo} />
      <PinnedStrap words={woven} />
      <Sections content={content} stats={stats} />
    </main>
  )
}
