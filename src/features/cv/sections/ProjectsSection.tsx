import type { ReactElement } from 'react'

import type { Project, Win } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import styles from '../cv.module.css'
import { resultLabel } from '../describe'
import { LABELS, WINS_ANCHOR } from '../labels'
import { Entry } from '../parts/Entry'
import { LinkList } from '../parts/LinkList'
import { Section } from '../parts/Section'

interface ProjectEntryProps {
  readonly project: Project
  /** The win this project came from, when it has one. */
  readonly win: Win | null
}

function ProjectEntry({ project, win }: ProjectEntryProps): ReactElement {
  // A winning project is described once, on its win record.
  const description = project.description ?? win?.description ?? null

  return (
    <Entry when={null}>
      <p className={styles.entryTitle}>{project.name}</p>
      {description !== null && <p>{description}</p>}
      {project.note !== null && <p className={styles.note}>{project.note}</p>}
      {win !== null && (
        <p className={styles.meta}>
          {LABELS.hackathonWin}:{' '}
          <a href={WINS_ANCHOR}>
            {resultLabel(win.result)}, {win.event}, {win.year}
          </a>
        </p>
      )}
      <LinkList links={project.links} context={project.name} />
    </Entry>
  )
}

interface ProjectsSectionProps {
  readonly projects: readonly Project[]
  readonly wins: readonly Win[]
}

export function ProjectsSection({ projects, wins }: ProjectsSectionProps): ReactElement {
  const winFor = (project: Project): Win | null =>
    wins.find((win) => win.id === project.winId) ?? null

  return (
    <Section id="projects">
      <ul className={styles.list}>
        {publishableProjects(projects).map((project) => (
          <ProjectEntry key={project.id} project={project} win={winFor(project)} />
        ))}
      </ul>
    </Section>
  )
}
