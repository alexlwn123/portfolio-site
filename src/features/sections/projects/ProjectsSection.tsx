import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { projectsCopy } from './copy'
import { CraftKnife } from './mat/CraftKnife'
import { MatRuler } from './mat/MatRuler'
import { Offcuts } from './mat/Offcuts'
import styles from './ProjectsSection.module.css'
import { ProjectSticker } from './ProjectSticker'
import { projectStickers } from './projectStickers'

/** After how many stickers the knife was put down, and the scraps swept together. */
const KNIFE_AFTER = 7
const OFFCUTS_AFTER = 17

/**
 * "Things I built": every project that may be shown, freshly cut and laid out
 * on the cutting mat, each a sticker of a different shape. The knife and the
 * weeded scraps lie among them. Static HTML and CSS.
 */
export const ProjectsSection: FunctionComponent<SectionProps> = ({ content }) => {
  const stickers = projectStickers(content)
  const cut = (from: number, to?: number) =>
    stickers.slice(from, to).map((sticker) => <ProjectSticker key={sticker.id} sticker={sticker} />)

  return (
    <SectionFrame
      id="projects"
      surface="mat"
      title={projectsCopy.title}
      kicker={projectsCopy.kicker}
    >
      <MatRuler edge="top" />
      <MatRuler edge="left" />
      <ul className={styles.stickers} aria-label={projectsCopy.list} role="list">
        {cut(0, KNIFE_AFTER)}
        <CraftKnife note={projectsCopy.mat.knife} className={styles.knife} />
        {cut(KNIFE_AFTER, OFFCUTS_AFTER)}
        <Offcuts note={projectsCopy.mat.offcuts} className={styles.offcuts} />
        {cut(OFFCUTS_AFTER)}
      </ul>
    </SectionFrame>
  )
}
