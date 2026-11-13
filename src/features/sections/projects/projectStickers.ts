import type { Content, Link, Project, Win } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { firstWeekNote, resultLabel } from '../../cv/describe'
import {
  balanceLines,
  compactSats,
  inPersonCity,
  ownHackathon,
  projectHome,
  shortEventName,
  shortYear,
  siteHost,
} from '../../lid/facts'
import { sectionAnchor } from '../sectionIds'
import { projectsCopy } from './copy'

/*
 * The stickers on the cutting mat, one for every project that may be shown.
 * Which shape a project is cut in is a design decision and is written here.
 * What a sticker says is not: every name, description, result and address is
 * read from the records.
 */

/** The shapes drawn for this section. Each is lettered with the project's name. */
export type DrawnKind =
  | 'capsule'
  | 'computer'
  | 'crate'
  | 'knight'
  | 'mint'
  | 'plinko'
  | 'puzzle'
  | 'ramp'
  | 'bubble'
  | 'shield'
  | 'stamp'
  | 'ticket'
  | 'tree'

export interface DrawnFace {
  readonly kind: DrawnKind
  /** The name, over one line or two. */
  readonly lines: readonly string[]
}

/** The faces that are the lid's own stickers, a size up. */
export type LidFace =
  | { readonly kind: 'crab'; readonly caption: string }
  | { readonly kind: 'button'; readonly top: string; readonly bottom: string }
  | { readonly kind: 'jukebox'; readonly name: string; readonly lines: readonly string[] }
  | {
      readonly kind: 'hex'
      readonly kicker: string
      readonly title: readonly string[]
      readonly foot: string
    }
  | { readonly kind: 'parking'; readonly letter: string; readonly name: string }

/** What a project with no drawing of its own gets: its name on a bumper sticker. */
export interface BumperFace {
  readonly kind: 'bumper'
  readonly lines: readonly [string, string]
}

export type Face = DrawnFace | LidFace | BumperFace
export type FaceKind = Face['kind']

/** The small flag on a project that won a hackathon. */
export interface WinFlagSpec {
  /** "1st", "2nd (tied)", "1st overall". */
  readonly result: string
  /** "SatsxSW 2022". */
  readonly event: string
  readonly href: string
}

/** How a description is attached: written by hand on the mat, or printed on label tape. */
export type CaptionKind = 'hand' | 'tape'

export interface ProjectSticker {
  readonly id: string
  readonly name: string
  /** His own description, or the win's when the record says "see wins". */
  readonly description: string | null
  /** Null when there is no description to attach. */
  readonly caption: CaptionKind | null
  /** True for the project that is also where he works. */
  readonly employer: boolean
  /**
   * The sticker's accessible name, when its face is a drawing. Null for a
   * face that is printed in words, which names itself.
   */
  readonly label: string | null
  /** Where the sticker itself leads. */
  readonly home: string
  readonly links: readonly Link[]
  readonly flag: WinFlagSpec | null
  readonly face: Face
}

/** The sticker the section opens with. */
export const LEAD_PROJECT = 'finite-computer'

/** A description up to this long is short enough to be written by hand. */
const HAND_MAX_LENGTH = 60

type FaceBuilder = (project: Project, win: Win | null, content: Content) => Face

function nameLines(name: string): readonly string[] {
  return balanceLines(name).filter((line) => line !== '')
}

function bumper(project: Project): BumperFace {
  return { kind: 'bumper', lines: balanceLines(project.name) }
}

function drawn(kind: DrawnKind): FaceBuilder {
  return (project) => ({ kind, lines: nameLines(project.name) })
}

/** The arcade button: the name round the top, the first week's takings round the foot. */
const button: FaceBuilder = (project, win) => ({
  kind: 'button',
  top: project.name,
  bottom:
    win?.firstWeekSats == null
      ? siteHost(projectHome(project))
      : projectsCopy.firstWeek(compactSats(win.firstWeekSats)),
})

/** The foil hexagon: it is a win badge, so without the win it cannot be lettered. */
const hex: FaceBuilder = (project, win, { organized }) => {
  if (win?.alsoOrganizedId == null) {
    return bumper(project)
  }
  const city = inPersonCity(ownHackathon(win, organized))

  return {
    kind: 'hex',
    kicker: resultLabel(win.result),
    title: project.name.split(' '),
    foot: `${projectsCopy.series} ${city} ${shortYear(win.year)}`,
  }
}

/** Which shape each project is cut in. A project that is not here gets a bumper. */
const FACES: Readonly<Record<string, FaceBuilder>> = Object.freeze({
  'finite-computer': drawn('computer'),
  'btc-plinko': drawn('plinko'),
  'cargo-leaderboard': drawn('crate'),
  'clawthing-store': (project) => ({ kind: 'crab', caption: project.name }),
  'fedimint-sdk': drawn('mint'),
  'web-to-svg-extension': drawn('puzzle'),
  bitcoinramps: drawn('ramp'),
  'last-pay-wins': button,
  'pleb-fm': (project) => ({
    kind: 'jukebox',
    name: project.name,
    lines: [siteHost(projectHome(project))],
  }),
  'rough-consensus': drawn('bubble'),
  'lightning-welder': hex,
  'arion-parking': (project) => ({
    kind: 'parking',
    letter: projectsCopy.parkingLetter,
    name: project.name,
  }),
  'auntie-ln': drawn('stamp'),
  'treepay-ux': drawn('tree'),
  'chesscup-hack': drawn('knight'),
  'tapass-fun': drawn('capsule'),
  kattis: drawn('ticket'),
  'stringer-safety': drawn('shield'),
})

/** The faces whose words are text a screen reader can read for itself. */
const WORDED: readonly FaceKind[] = ['bumper', 'jukebox', 'parking']

/** What a drawn sticker is called. The button's figure is drawn too, so it is said here. */
function labelFor(project: Project, win: Win | null, face: Face): string | null {
  if (WORDED.includes(face.kind)) {
    return null
  }
  return face.kind === 'button' && win?.firstWeekSats != null
    ? `${project.name}: ${firstWeekNote(win.firstWeekSats)}`
    : project.name
}

function winFlag(win: Win): WinFlagSpec {
  return {
    result: resultLabel(win.result),
    event: `${shortEventName(win.event)} ${String(win.year)}`,
    href: sectionAnchor('wins'),
  }
}

function captionFor(description: string | null): CaptionKind | null {
  if (description === null) {
    return null
  }
  return description.length <= HAND_MAX_LENGTH ? 'hand' : 'tape'
}

function toSticker(project: Project, content: Content): ProjectSticker {
  const win = content.wins.find(({ id }) => id === project.winId) ?? null
  // A winning project is described once, on its win record.
  const description = project.description ?? win?.description ?? null
  const face = (FACES[project.id] ?? bumper)(project, win, content)

  return {
    id: project.id,
    name: project.name,
    description,
    caption: captionFor(description),
    employer: project.name === content.profile.role.organization,
    label: labelFor(project, win, face),
    home: projectHome(project),
    links: project.links,
    flag: win === null ? null : winFlag(win),
    face,
  }
}

/** Every publishable project as a sticker: the lead first, then the order of his profile. */
export function projectStickers(content: Content): readonly ProjectSticker[] {
  const shown = publishableProjects(content.projects)
  const lead = shown.filter(({ id }) => id === LEAD_PROJECT)
  const rest = shown.filter(({ id }) => id !== LEAD_PROJECT)

  return [...lead, ...rest].map((project) => toSticker(project, content))
}
