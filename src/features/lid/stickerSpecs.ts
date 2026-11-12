/*
 * What each kind of sticker needs in order to be drawn. A spec holds finished
 * text and addresses only: stickers.ts fills it from the content module, and
 * the components print it without knowing where it came from.
 */

import type { PropertyTagCut } from '../stickers/PropertyTag'
import type { Tone } from '../stickers/tones'

export type { PropertyTagCut, Tone }

interface Spec<Kind extends string, Id extends string> {
  readonly id: Id
  readonly kind: Kind
}

interface LinkSpec<Kind extends string, Id extends string> extends Spec<Kind, Id> {
  readonly href: string
}

export interface TextLink {
  readonly label: string
  readonly href: string
}

export interface RibbonSpec extends TextLink {
  /** "×16", or null for a ribbon without a count. */
  readonly count: string | null
  readonly tone: Tone
}

export interface NameSpec<Id extends string> extends Spec<'name', Id> {
  /** The name as read out: the die-cut letters themselves are a drawing. */
  readonly name: string
  readonly lines: readonly [string, string]
}

export interface LanyardSpec<Id extends string> extends Spec<'lanyard', Id> {
  /** The words printed along each strap, repeated to fill it. */
  readonly left: readonly string[]
  readonly right: readonly string[]
}

export interface BadgeSpec<Id extends string> extends Spec<'badge', Id> {
  readonly roles: readonly string[]
  readonly photoAlt: string
  readonly givenName: string
  readonly familyName: string
  readonly title: string
  readonly organization: string
  readonly ribbonsLabel: string
  readonly ribbons: readonly RibbonSpec[]
}

export interface HelloSpec<Id extends string> extends Spec<'hello', Id> {
  readonly greeting: string
  readonly lead: string
  /** The handwriting, a sentence to a line. */
  readonly lines: readonly string[]
  /** A phrase of the handwriting run over with the highlighter. */
  readonly highlight: string
}

/** The cover's cue to scroll: a line in his hand that leads down to the pile. */
export interface CueSpec<Id extends string> extends LinkSpec<'cue', Id> {
  readonly text: string
}

/** A heading that is a sticker, shouted over two lines, as every section's is. */
export interface HeadingSpec<Id extends string> extends Spec<'heading', Id> {
  readonly lines: readonly [string, string]
}

/** A line in his handwriting, written straight onto the lid. */
export interface ScrawlSpec<Id extends string> extends Spec<'scrawl', Id> {
  readonly text: string
}

export interface AssetTagSpec<Id extends string> extends LinkSpec<'assetTag', Id> {
  readonly kicker: string
  readonly label: string
}

/** An employer's asset tag: whose it was, and the small print under the name. */
export interface PropertyTagSpec<Id extends string> extends LinkSpec<'propertyTag', Id> {
  readonly kicker: string
  readonly organization: string
  /** "Issued 2024", "In service", both, or null when the record gives neither. */
  readonly issued: string | null
  readonly cut: PropertyTagCut
}

export interface StarburstSpec<Id extends string> extends LinkSpec<'starburst', Id> {
  readonly label: string
  readonly top: string
  readonly figure: string
  readonly bottom: string
}

export interface RoundBadgeSpec<Id extends string> extends LinkSpec<'roundBadge', Id> {
  readonly label: string
  /** The two phrases set around the rim. */
  readonly ring: readonly [string, string]
  readonly figure: string
}

export interface FoilWinSpec<Id extends string> extends LinkSpec<'foilWin', Id> {
  readonly rank: string
  readonly title: string
  readonly lines: readonly string[]
}

export interface MedalSpec<Id extends string> extends LinkSpec<'medal', Id> {
  readonly label: string
  readonly rank: string
  /** Short lines under the rank. */
  readonly lines: readonly string[]
  /** The two phrases set round the rim. */
  readonly rim: readonly [string, string]
  readonly tone: Tone
}

export interface ComplianceLabelSpec<Id extends string> extends LinkSpec<'complianceLabel', Id> {
  readonly heading: string
  /** The publication numbers it lists, in the order it lists them. */
  readonly numbers: readonly string[]
}

export type BoltSpec<Id extends string> = Spec<'bolt', Id>

export interface PillSpec<Id extends string> extends Spec<'pill', Id> {
  readonly text: string
  readonly tone: Tone
  readonly big: boolean
}

export interface BumperSpec<Id extends string> extends LinkSpec<'bumper', Id> {
  readonly lines: readonly [string, string]
  readonly note: string
}

export interface ArcadeButtonSpec<Id extends string> extends LinkSpec<'arcadeButton', Id> {
  readonly label: string
  readonly top: string
  readonly bottom: string
}

export interface ParkingSignSpec<Id extends string> extends LinkSpec<'parkingSign', Id> {
  readonly letter: string
  readonly name: string
}

export interface CrabSpec<Id extends string> extends LinkSpec<'crab', Id> {
  readonly label: string
  readonly caption: string
}

export interface JukeboxSpec<Id extends string> extends LinkSpec<'jukebox', Id> {
  readonly name: string
  readonly lines: readonly string[]
}

export interface RecordSpec<Id extends string> extends LinkSpec<'record', Id> {
  readonly mark: string
  readonly lines: readonly string[]
}

export interface HexBadgeSpec<Id extends string> extends LinkSpec<'hexBadge', Id> {
  readonly label: string
  readonly kicker: string
  readonly title: readonly string[]
  readonly foot: string
}

export interface GhostSpec<Id extends string> extends Spec<'ghost', Id> {
  readonly note: string
  readonly detail: string | null
}

export interface TallySpec<Id extends string> extends Spec<'tally', Id> {
  readonly count: number
}

export interface WristbandSpec<Id extends string> extends Spec<'wristband', Id> {
  readonly label: string
  readonly tone: Tone
  readonly links: readonly TextLink[]
}

/** The speaker: a button that turns the lid's sounds on and off. */
export interface SoundSpec<Id extends string> extends Spec<'sound', Id> {
  readonly label: string
}

/** A button that puts every sticker back where it was stuck. */
export interface TidySpec<Id extends string> extends Spec<'tidy', Id> {
  readonly lines: readonly string[]
}

/** A button, on a phone, that lets tilting it move the light. */
export interface TiltSpec<Id extends string> extends Spec<'tilt', Id> {
  readonly lines: readonly string[]
}

/**
 * What is stuck underneath a sticker: a short note in his own hand. A note is
 * not part of a sticker's spec. notes.ts builds them, keyed by sticker id.
 */
export interface NoteSpec {
  /** What the note is about. Read out with each link, so "Code" is never ambiguous. */
  readonly title: string
  /** What it is, the result and the year, one sentence to a line. */
  readonly lines: readonly string[]
  readonly links: readonly TextLink[]
}

export type StickerSpec<Id extends string = string> =
  | NameSpec<Id>
  | LanyardSpec<Id>
  | BadgeSpec<Id>
  | HelloSpec<Id>
  | CueSpec<Id>
  | HeadingSpec<Id>
  | ScrawlSpec<Id>
  | AssetTagSpec<Id>
  | PropertyTagSpec<Id>
  | StarburstSpec<Id>
  | RoundBadgeSpec<Id>
  | FoilWinSpec<Id>
  | MedalSpec<Id>
  | ComplianceLabelSpec<Id>
  | BoltSpec<Id>
  | PillSpec<Id>
  | BumperSpec<Id>
  | ArcadeButtonSpec<Id>
  | ParkingSignSpec<Id>
  | CrabSpec<Id>
  | JukeboxSpec<Id>
  | RecordSpec<Id>
  | HexBadgeSpec<Id>
  | GhostSpec<Id>
  | TallySpec<Id>
  | WristbandSpec<Id>
  | SoundSpec<Id>
  | TidySpec<Id>
  | TiltSpec<Id>

export type StickerKind = StickerSpec['kind']

/** Stickers that belong together, announced as one list. */
export interface GroupSpec<Id extends string = string> {
  readonly kind: 'group'
  readonly key: string
  readonly label: string
  readonly stickers: readonly StickerSpec<Id>[]
}

export type LidItem<Id extends string = string> = StickerSpec<Id> | GroupSpec<Id>

/** Kinds that are drawn for the eye only and say nothing a reader needs. */
const DECORATION: readonly StickerKind[] = ['lanyard', 'bolt', 'tally']

export function isDecoration(spec: StickerSpec): boolean {
  return DECORATION.includes(spec.kind)
}

/** Kinds that are buttons, not content: they do something to the lid itself. */
const CONTROLS: readonly StickerKind[] = ['sound', 'tidy', 'tilt']

export function isControl(spec: StickerSpec): boolean {
  return CONTROLS.includes(spec.kind)
}

/** Every address a sticker links to, in the order it presents them. */
export function linksOf(spec: StickerSpec): readonly string[] {
  if (spec.kind === 'badge') {
    return spec.ribbons.map(({ href }) => href)
  }
  if (spec.kind === 'wristband') {
    return spec.links.map(({ href }) => href)
  }
  return 'href' in spec ? [spec.href] : []
}

/** The stickers of a lid, with the groups opened out, in reading order. */
export function flattenStickers<Id extends string>(
  items: readonly LidItem<Id>[],
): readonly StickerSpec<Id>[] {
  return items.flatMap((item) => (item.kind === 'group' ? item.stickers : [item]))
}
