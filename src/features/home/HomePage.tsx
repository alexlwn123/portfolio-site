import type { ReactElement } from 'react'

import type { Content, Stats } from '../../content'
import type { BadgePhotoImage } from '../badge/photoSources'
import { Lid } from '../lid/Lid'
import { Sections } from '../sections/Sections'

interface HomePageProps {
  readonly content: Content
  readonly stats: Stats
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
}

/**
 * The home page: the lid first, then the career in full, section by section.
 * Static HTML and CSS. The page loads one script that makes the lid move, and
 * everything here is whole without it.
 */
export function HomePage({ content, stats, photo }: HomePageProps): ReactElement {
  return (
    <main>
      <Lid content={content} stats={stats} photo={photo} />
      <Sections content={content} stats={stats} />
    </main>
  )
}
