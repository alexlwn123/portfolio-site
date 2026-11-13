import { ContentError } from './parse'
import type { Content } from './schema'

interface Reference {
  readonly path: readonly PropertyKey[]
  readonly id: string
  readonly target: 'wins' | 'organized'
}

type Referencing = Pick<Content, 'wins' | 'organized' | 'projects' | 'press'>

function collectReferences(content: Referencing): readonly Reference[] {
  const fromWins = content.wins.flatMap((win, index): Reference[] =>
    win.alsoOrganizedId === null
      ? []
      : [{ path: [index, 'alsoOrganizedId'], id: win.alsoOrganizedId, target: 'organized' }],
  )
  const fromProjects = content.projects.flatMap((project, index): Reference[] =>
    project.winId === null ? [] : [{ path: [index, 'winId'], id: project.winId, target: 'wins' }],
  )
  const fromPress = content.press.flatMap(({ subject }, index): Reference[] => {
    if (subject.kind === 'organizedEvent') {
      return [
        { path: [index, 'subject', 'organizedId'], id: subject.organizedId, target: 'organized' },
      ]
    }
    if (subject.kind === 'win') {
      return [{ path: [index, 'subject', 'winId'], id: subject.winId, target: 'wins' }]
    }
    return []
  })

  return [
    ...fromWins.map((reference) => ({ ...reference, path: ['wins', ...reference.path] })),
    ...fromProjects.map((reference) => ({ ...reference, path: ['projects', ...reference.path] })),
    ...fromPress.map((reference) => ({ ...reference, path: ['press', ...reference.path] })),
  ]
}

/**
 * Checks that every id one record uses to point at another exists. Runs when
 * the content module loads, so a dangling reference fails the build.
 */
export function assertReferences(content: Referencing): void {
  const known = {
    wins: new Set(content.wins.map((win) => win.id)),
    organized: new Set(content.organized.map((event) => event.id)),
  }
  const dangling = collectReferences(content).filter(({ id, target }) => !known[target].has(id))

  if (dangling.length > 0) {
    throw new ContentError(
      'content',
      dangling.map(({ path, id, target }) => ({
        path,
        message: `No ${target} record has the id "${id}"`,
      })),
    )
  }
}
