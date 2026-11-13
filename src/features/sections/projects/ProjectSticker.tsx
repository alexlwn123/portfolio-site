import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { ArrowDown } from '../../stickers/illustrations/Glyphs'
import { svgId } from '../../stickers/svgIds'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { projectsCopy } from './copy'
import { type MatPlace, placeData } from './matRows'
import { LinkChips } from './parts/LinkChips'
import { ProjectFace } from './ProjectFace'
import styles from './ProjectSticker.module.css'
import type { ProjectSticker as ProjectStickerSpec } from './projectStickers'
import { WinFlag } from './WinFlag'

/** Every id this section puts on the page starts with this, so none meets one of the lid's. */
const ID_PREFIX = 'projects'

interface ProjectStickerProps {
  readonly sticker: ProjectStickerSpec
  /** Where it stands on the mat. A sticker with no place is laid out by whoever holds it. */
  readonly place?: MatPlace | undefined
}

/**
 * One project on the mat: its sticker, which leads to the project, and under
 * it what the project is, written by hand or on a strip of tape, its links,
 * and a flag when it won a hackathon. The sticker and its caption are two
 * parts, so that a row of stickers can stand on one line with their captions
 * hanging under it.
 */
export function ProjectSticker({ sticker, place }: ProjectStickerProps): ReactElement {
  const { id, name, face, label, flag, employer, description, caption, links, home } = sticker
  const ownId = svgId(ID_PREFIX, id)
  const titleId = svgId(ownId, 'name')

  return (
    <li
      className={styles.item}
      data-project={id}
      data-face={face.kind}
      data-won={flag === null ? undefined : ''}
      data-day-job={employer ? '' : undefined}
      aria-labelledby={titleId}
      {...placeData(place)}
    >
      <div className={styles.top} data-art="">
        <h3 id={titleId} className={styles.name}>
          <Stuck href={home} label={label ?? undefined} className={styles.face}>
            <ProjectFace id={ownId} face={face} />
          </Stuck>
        </h3>
        {flag !== null && <WinFlag owner={name} flag={flag} className={styles.flag} />}
        {employer && (
          <p className={cx(voice.marker, styles.dayJob)}>
            {projectsCopy.dayJob} <ArrowDown className={styles.pointer} />
          </p>
        )}
      </div>
      <div className={styles.about}>
        {description !== null && (
          <p className={caption === 'hand' ? cx(voice.marker, styles.hand) : styles.tape}>
            {description}
          </p>
        )}
        <LinkChips links={links} context={name} className={styles.links} />
      </div>
    </li>
  )
}
