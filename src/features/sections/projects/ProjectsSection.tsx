import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { projectsCopy } from './copy'
import { CraftKnife } from './mat/CraftKnife'
import { MatRuler } from './mat/MatRuler'
import { Offcuts } from './mat/Offcuts'
import { matPlaces } from './matRows'
import styles from './ProjectsSection.module.css'
import { ProjectSticker } from './ProjectSticker'
import { projectStickers } from './projectStickers'

/** After how many stickers the knife was put down. On a phone it lies between two of them. */
const KNIFE_AFTER = 7

/**
 * "Things I built": every project that may be shown, freshly cut and stood in
 * rows on the cutting mat, each a sticker of a different shape. The knife
 * lies over the first row and the weeded scraps are swept to the end of the
 * last. Static HTML and CSS.
 */
export const ProjectsSection: FunctionComponent<SectionProps> = ({ content }) => {
  const stickers = projectStickers(content)
  const places = matPlaces(stickers)
  const cut = (from: number, to?: number) =>
    stickers
      .slice(from, to)
      .map((sticker, index) => (
        <ProjectSticker key={sticker.id} sticker={sticker} place={places.stickers[from + index]} />
      ))

  return (
    <SectionFrame id="projects" surface="mat" title={projectsCopy.title}>
      <MatRuler edge="top" />
      <MatRuler edge="left" />
      <ul className={styles.stickers} aria-label={projectsCopy.list} role="list">
        {cut(0, KNIFE_AFTER)}
        <CraftKnife note={projectsCopy.mat.knife} className={styles.knife} />
        {cut(KNIFE_AFTER)}
        <Offcuts note={projectsCopy.mat.offcuts} className={styles.offcuts} place={places.scraps} />
      </ul>
    </SectionFrame>
  )
}
