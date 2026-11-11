import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Badge } from '../badge/Badge'
import hang from '../badge/hang.module.css'
import { Lanyard, strapsClass } from '../badge/Lanyard'
import type { BadgePhotoImage } from '../badge/photoSources'
import { AssetTag } from '../stickers/AssetTag'
import { Bumper } from '../stickers/Bumper'
import { ComplianceLabel } from '../stickers/ComplianceLabel'
import { DieCutText } from '../stickers/DieCutText'
import { FoilWin } from '../stickers/FoilWin'
import { Ghost } from '../stickers/Ghost'
import { HelloTag } from '../stickers/HelloTag'
import { HexBadge } from '../stickers/HexBadge'
import { ArcadeButton } from '../stickers/illustrations/ArcadeButton'
import { Bolt } from '../stickers/illustrations/Bolt'
import { Crab } from '../stickers/illustrations/Crab'
import { Jukebox } from '../stickers/Jukebox'
import { Medal } from '../stickers/Medal'
import { ParkingSign } from '../stickers/ParkingSign'
import { Pill } from '../stickers/Pill'
import { RecordSticker } from '../stickers/RecordSticker'
import { RoundBadge } from '../stickers/RoundBadge'
import { Starburst } from '../stickers/Starburst'
import { Sticker, type StickerProps } from '../stickers/Sticker'
import { Tally } from '../stickers/Tally'
import { Wristband } from '../stickers/Wristband'
import styles from './Lid.module.css'
import type { StickerKind, StickerSpec } from './stickerSpecs'

/*
 * One sticker on the lid: the face its spec describes, inside the placed
 * element that the placement stylesheet finds by id.
 */

export interface StickerViewProps {
  readonly spec: StickerSpec
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
}

type Frame = Pick<StickerProps, 'as' | 'flat' | 'decorative' | 'selfSized' | 'className'>

/** Inside a link everything must be phrasing content, so those stickers are spans. */
const INLINE: Frame = { as: 'span' }
/** Drawn or marked straight onto the lid: no shadow, no lift. */
const ON_THE_LID: Frame = { flat: true }

/** How each kind of sticker is stuck down. What it leads to comes from its spec. */
const FRAMES: Readonly<Record<StickerKind, Frame>> = {
  name: { as: 'h1', className: styles.heading },
  lanyard: { flat: true, decorative: true, className: cx(hang.hang, strapsClass) },
  badge: { flat: true, className: hang.hang },
  hello: {},
  assetTag: INLINE,
  starburst: INLINE,
  roundBadge: INLINE,
  foilWin: INLINE,
  medal: INLINE,
  complianceLabel: INLINE,
  bolt: { as: 'span', decorative: true },
  pill: { as: 'span', selfSized: true },
  bumper: INLINE,
  arcadeButton: INLINE,
  parkingSign: INLINE,
  crab: INLINE,
  jukebox: INLINE,
  record: INLINE,
  hexBadge: INLINE,
  ghost: ON_THE_LID,
  tally: { as: 'span', flat: true, decorative: true },
  wristband: { as: 'nav' },
}

function face(spec: StickerSpec, photo: BadgePhotoImage): ReactElement {
  switch (spec.kind) {
    case 'name':
      // The heading's only content: the lettering is an image named for him.
      return <DieCutText id={spec.id} lines={spec.lines} label={spec.name} />
    case 'lanyard':
      return <Lanyard {...spec} />
    case 'badge':
      return <Badge {...spec} photo={photo} />
    case 'hello':
      return <HelloTag {...spec} />
    case 'assetTag':
      return <AssetTag {...spec} />
    case 'starburst':
      return <Starburst {...spec} />
    case 'roundBadge':
      return <RoundBadge {...spec} />
    case 'foilWin':
      return <FoilWin {...spec} />
    case 'medal':
      return <Medal {...spec} />
    case 'complianceLabel':
      return <ComplianceLabel {...spec} />
    case 'bolt':
      return <Bolt />
    case 'pill':
      return <Pill {...spec} />
    case 'bumper':
      return <Bumper {...spec} />
    case 'arcadeButton':
      return <ArcadeButton {...spec} />
    case 'parkingSign':
      return <ParkingSign {...spec} />
    case 'crab':
      return <Crab {...spec} />
    case 'jukebox':
      return <Jukebox {...spec} />
    case 'record':
      return <RecordSticker {...spec} />
    case 'hexBadge':
      return <HexBadge {...spec} />
    case 'ghost':
      return <Ghost {...spec} />
    case 'tally':
      return <Tally {...spec} />
    case 'wristband':
      return <Wristband {...spec} />
  }
}

/**
 * A sticker with an address is a link, and one with a label takes it as its
 * accessible name: a drawing has no text of its own to be read.
 */
export function StickerView({ spec, photo }: StickerViewProps): ReactElement {
  return (
    <Sticker
      id={spec.id}
      {...FRAMES[spec.kind]}
      href={'href' in spec ? spec.href : undefined}
      label={'label' in spec ? spec.label : undefined}
    >
      {face(spec, photo)}
    </Sticker>
  )
}
