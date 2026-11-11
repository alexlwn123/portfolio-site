import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { Badge } from '../badge/Badge'
import hang from '../badge/hang.module.css'
import { Lanyard, strapsClass } from '../badge/Lanyard'
import type { BadgePhotoImage } from '../badge/photoSources'
import { AssetTag } from '../stickers/AssetTag'
import { Bumper } from '../stickers/Bumper'
import { ComplianceLabel } from '../stickers/ComplianceLabel'
import { Cue } from '../stickers/Cue'
import { SoundFace } from '../stickers/controls/SoundFace'
import { WordsFace } from '../stickers/controls/WordsFace'
import { DieCutText } from '../stickers/DieCutText'
import { FoilWin } from '../stickers/FoilWin'
import { Ghost } from '../stickers/Ghost'
import { HelloTag } from '../stickers/HelloTag'
import { HexBadge } from '../stickers/HexBadge'
import { ArcadeButton } from '../stickers/illustrations/ArcadeButton'
import { Bolt } from '../stickers/illustrations/Bolt'
import { Crab } from '../stickers/illustrations/Crab'
import { Scrawl } from '../stickers/Scrawl'
import { Jukebox } from '../stickers/Jukebox'
import { Medal } from '../stickers/Medal'
import { ParkingSign } from '../stickers/ParkingSign'
import { PeelSticker, type PeelShape } from '../stickers/PeelSticker'
import { Pill } from '../stickers/Pill'
import { PropertyTag } from '../stickers/PropertyTag'
import { RecordSticker } from '../stickers/RecordSticker'
import { RoundBadge } from '../stickers/RoundBadge'
import { Starburst } from '../stickers/Starburst'
import { Sticker, type StickerProps } from '../stickers/Sticker'
import { Tally } from '../stickers/Tally'
import { Wristband } from '../stickers/Wristband'
import { copy } from '../../content/copy'
import { HeadingLabel } from '../sections/HeadingLabel'
import { PILE_TITLE_ID } from './anchor'
import styles from './Lid.module.css'
import type { NoteSpec, StickerKind, StickerSpec } from './stickerSpecs'

/*
 * One sticker on the lid: the face its spec describes, inside the placed
 * element that the placement stylesheet finds by id.
 */

export interface StickerViewProps {
  readonly spec: StickerSpec
  /** The badge's portrait, resolved by the page through the image pipeline. */
  readonly photo: BadgePhotoImage
  /** What is stuck underneath the sticker, when something is. */
  readonly note?: NoteSpec | undefined
}

type Frame = Pick<
  StickerProps,
  'as' | 'anchor' | 'flat' | 'decorative' | 'selfSized' | 'className' | 'control' | 'toggle'
>

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
  cue: { flat: true },
  heading: { as: 'h2', anchor: PILE_TITLE_ID, selfSized: true, className: styles.heading },
  scrawl: { as: 'p', flat: true, className: styles.scrawl },
  assetTag: INLINE,
  propertyTag: { as: 'span', selfSized: true },
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
  sound: { control: 'sound', toggle: true },
  tidy: { control: 'tidy' },
  tilt: { control: 'tilt', toggle: true },
}

/** Round drawings peel from their rim, not from the empty corner of their box. */
const ROUND: readonly StickerKind[] = ['medal', 'arcadeButton', 'hexBadge', 'crab']

function peelShape(kind: StickerKind): PeelShape {
  return ROUND.includes(kind) ? 'round' : 'card'
}

type OpeningSpec = Extract<StickerSpec, { kind: 'name' | 'lanyard' | 'badge' | 'hello' }>
type WrittenSpec = Extract<StickerSpec, { kind: 'cue' | 'heading' | 'scrawl' }>
type MetalSpec = Extract<StickerSpec, { kind: 'assetTag' | 'propertyTag' | 'complianceLabel' }>
type ControlSpec = Extract<StickerSpec, { kind: 'sound' | 'tidy' | 'tilt' }>
type AwardSpec = Extract<
  StickerSpec,
  { kind: 'starburst' | 'roundBadge' | 'foilWin' | 'medal' | 'hexBadge' | 'tally' }
>
type ProjectSpec = Extract<
  StickerSpec,
  { kind: 'bumper' | 'arcadeButton' | 'parkingSign' | 'crab' | 'jukebox' | 'record' }
>

/** What the lid opens with: his name, his badge on its lanyard and his introduction. */
function openingFace(spec: OpeningSpec, photo: BadgePhotoImage): ReactElement {
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
  }
}

/** What tells a visitor where they are and where to go: the cue, the pile's heading and the line under it. */
function writtenFace(spec: WrittenSpec): ReactElement {
  switch (spec.kind) {
    case 'cue':
      return <Cue text={spec.text} />
    case 'heading':
      return <HeadingLabel lines={spec.lines} />
    case 'scrawl':
      return <Scrawl text={spec.text} />
  }
}

/** The serious stickers: tags and labels of the kind a company sticks on a laptop. */
function metalFace(spec: MetalSpec): ReactElement {
  switch (spec.kind) {
    case 'assetTag':
      return <AssetTag {...spec} />
    case 'propertyTag':
      return <PropertyTag {...spec} />
    case 'complianceLabel':
      return <ComplianceLabel {...spec} />
  }
}

/** The faces of the three buttons. */
function controlFace(spec: ControlSpec): ReactElement {
  switch (spec.kind) {
    case 'sound':
      return <SoundFace />
    case 'tidy':
      return <WordsFace lines={spec.lines} tone="white" />
    case 'tilt':
      return <WordsFace lines={spec.lines} tone="hi" />
  }
}

/** The stickers that count something or mark a win. */
function awardFace(spec: AwardSpec): ReactElement {
  switch (spec.kind) {
    case 'starburst':
      return <Starburst {...spec} />
    case 'roundBadge':
      return <RoundBadge {...spec} />
    case 'foilWin':
      return <FoilWin {...spec} />
    case 'medal':
      return <Medal {...spec} />
    case 'hexBadge':
      return <HexBadge {...spec} />
    case 'tally':
      return <Tally {...spec} />
  }
}

/** The stickers for things he made, and the talk he gives about making them. */
function projectFace(spec: ProjectSpec): ReactElement {
  switch (spec.kind) {
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
  }
}

function face(spec: StickerSpec, photo: BadgePhotoImage): ReactElement {
  switch (spec.kind) {
    case 'name':
    case 'lanyard':
    case 'badge':
    case 'hello':
      return openingFace(spec, photo)
    case 'cue':
    case 'heading':
    case 'scrawl':
      return writtenFace(spec)
    case 'assetTag':
    case 'propertyTag':
    case 'complianceLabel':
      return metalFace(spec)
    case 'starburst':
    case 'roundBadge':
    case 'foilWin':
    case 'medal':
    case 'hexBadge':
    case 'tally':
      return awardFace(spec)
    case 'bumper':
    case 'arcadeButton':
    case 'parkingSign':
    case 'crab':
    case 'jukebox':
    case 'record':
      return projectFace(spec)
    case 'bolt':
      return <Bolt />
    case 'pill':
      return <Pill {...spec} />
    case 'ghost':
      return <Ghost {...spec} />
    case 'wristband':
      return <Wristband {...spec} />
    case 'sound':
    case 'tidy':
    case 'tilt':
      return controlFace(spec)
  }
}

/**
 * A sticker with an address is a link, and one with a label takes it as its
 * accessible name: a drawing has no text of its own to be read. A sticker
 * with a note under it is a link too, with a corner that peels beside it.
 */
export function StickerView({ spec, photo, note }: StickerViewProps): ReactElement {
  if (note !== undefined && 'href' in spec) {
    return (
      <PeelSticker
        id={spec.id}
        href={spec.href}
        label={'label' in spec ? spec.label : undefined}
        peelLabel={copy.lid.note.peel(note.title)}
        shape={peelShape(spec.kind)}
        note={note}
      >
        {face(spec, photo)}
      </PeelSticker>
    )
  }
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
