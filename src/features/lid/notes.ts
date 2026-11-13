import type { Content, Link, Project, Win } from '../../content'
import { copy } from '../../content/copy'
import { deepFreeze } from '../../lib/deepFreeze'
import { eventLabel, fieldLabel, firstWeekNote, resultLabel, winTitle } from '../cv/describe'
import { type HomeSectionId, sectionAnchor } from '../sections/sectionIds'
import { findById, latestPodiumWin } from './facts'
import type { NoteSpec, TextLink } from './stickerSpecs'
import { FIELD_WIN, type StickerId } from './stickers'

/*
 * What is stuck underneath the project and win stickers: a short note that
 * says what the thing is, how it did and when, with the record's own links.
 * Like the stickers, a note states nothing of its own. Every line is read
 * from a win or a project record, and the CV prints the same records in full.
 */

/** The stickers that have a note under them: every win and every project on the lid. */
export const NOTED_IDS = [
  'latest-win',
  'ncr-win',
  'lightning-welder',
  'last-pay-wins',
  'arion-parking',
  'clawthing-store',
  'pleb-fm',
] as const satisfies readonly StickerId[]

export type NotedId = (typeof NOTED_IDS)[number]

export type LidNotes = Readonly<Record<NotedId, NoteSpec>>

export function isNoted(id: string): id is NotedId {
  return NOTED_IDS.some((noted) => noted === id)
}

/** The sections of this page a note can lead on to. */
type NotedSection = Extract<HomeSectionId, 'wins' | 'projects'>

/**
 * The record's links, each address once, followed by the way to the full
 * story: the section of this page the sticker belongs to. A press on the
 * sticker peels it, so this link is how a visitor goes on from it.
 */
function linksOf(links: readonly Link[], section: NotedSection): readonly TextLink[] {
  const unique = links.filter(
    (link, index) => links.findIndex(({ url }) => url === link.url) === index,
  )
  return [
    ...unique.map(({ label, url }) => ({ label, href: url })),
    { label: copy.lid.note.more, href: sectionAnchor(section) },
  ]
}

/** What it is, the result and the year, then the figures the record keeps. */
function winLines(win: Win): readonly string[] {
  return [
    ...(win.description === null ? [] : [win.description]),
    copy.lid.note.result(resultLabel(win.result), eventLabel(win), win.year),
    ...(win.field === null ? [] : [`${fieldLabel(win.field)}.`]),
    ...(win.firstWeekSats === null ? [] : [firstWeekNote(win.firstWeekSats)]),
  ]
}

/** The note under a win's own sticker. The project it came from lends its links. */
function winNote(win: Win, projects: readonly Project[]): NoteSpec {
  const project = projects.find(({ winId }) => winId === win.id)

  return {
    title: winTitle(win),
    lines: winLines(win),
    links: linksOf([...(project?.links ?? []), ...win.links], 'wins'),
  }
}

/** The note under a project's sticker. A project that won says so in its win's words. */
function projectNote(project: Project, wins: readonly Win[]): NoteSpec {
  const win = wins.find(({ id }) => id === project.winId)
  const described = project.description === null ? [] : [project.description]

  return {
    title: project.name,
    lines: win === undefined ? described : winLines(win),
    links: linksOf([...project.links, ...(win?.links ?? [])], 'projects'),
  }
}

/** The note under each noted sticker, filled in from the content. */
export function lidNotes({ wins, projects }: Pick<Content, 'wins' | 'projects'>): LidNotes {
  const win = (id: string): NoteSpec => winNote(findById(wins, id, 'win'), projects)
  const project = (id: string): NoteSpec => projectNote(findById(projects, id, 'project'), wins)

  const notes: LidNotes = {
    'latest-win': winNote(latestPodiumWin(wins), projects),
    'ncr-win': win(FIELD_WIN),
    'lightning-welder': win('lightning-welder'),
    'last-pay-wins': project('last-pay-wins'),
    'arion-parking': project('arion-parking'),
    'clawthing-store': project('clawthing-store'),
    'pleb-fm': project('pleb-fm'),
  }
  return deepFreeze(notes)
}
