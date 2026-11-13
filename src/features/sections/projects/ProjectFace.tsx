import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { HexBadge } from '../../stickers/HexBadge'
import { ArcadeButton } from '../../stickers/illustrations/ArcadeButton'
import { Crab } from '../../stickers/illustrations/Crab'
import { Jukebox } from '../../stickers/Jukebox'
import { Lines } from '../../stickers/Lines'
import { ParkingSign } from '../../stickers/ParkingSign'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { DRAWINGS } from './art'
import styles from './ProjectFace.module.css'
import type { Face } from './projectStickers'

interface ProjectFaceProps {
  /** An id no other drawing on the page has. Ids inside the drawing are built from it. */
  readonly id: string
  readonly face: Face
}

/**
 * The face of a project's sticker: one of the lid's own, a size up, a shape
 * drawn for this section, or a plain bumper when nobody has drawn one yet.
 */
export function ProjectFace({ id, face }: ProjectFaceProps): ReactElement {
  switch (face.kind) {
    case 'crab':
      return <Crab id={id} caption={face.caption} />
    case 'button':
      return <ArcadeButton id={id} top={face.top} bottom={face.bottom} />
    case 'jukebox':
      return <Jukebox name={face.name} lines={face.lines} />
    case 'hex':
      return <HexBadge kicker={face.kicker} title={face.title} foot={face.foot} />
    case 'parking':
      return <ParkingSign letter={face.letter} name={face.name} />
    case 'bumper':
      return (
        <Vinyl tone="hi" className={styles.bumper}>
          <span className={cx(voice.display, styles.words)}>
            <Lines lines={face.lines} />
          </span>
        </Vinyl>
      )
    default: {
      const Drawing = DRAWINGS[face.kind]
      return <Drawing id={id} lines={face.lines} />
    }
  }
}
