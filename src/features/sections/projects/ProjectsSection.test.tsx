import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { projectsCopy } from './copy'
import { ProjectsSection } from './ProjectsSection'

const publishable = publishableProjects(content.projects)

function renderSection(): HTMLElement {
  render(<ProjectsSection content={content} stats={stats} />)
  return screen.getByRole('region', { name: /^Things\s*I built$/ })
}

describe('ProjectsSection', () => {
  it('is the "projects" section, on the cutting mat', () => {
    const section = renderSection()

    expect(section.id).toBe('projects')
    expect(section).toHaveAttribute('data-surface', 'mat')
    expect(within(section).getByText(projectsCopy.kicker)).toBeVisible()
  })

  it('lays out one sticker for every publishable project, the lead first', () => {
    const section = renderSection()
    const items = within(within(section).getByRole('list', { name: 'Projects' }))
      .getAllByRole('listitem')
      .filter((item) => item.hasAttribute('data-project'))

    expect(items).toHaveLength(publishable.length)
    expect(items).toHaveLength(18)
    expect(items[0]).toHaveAttribute('data-project', 'finite-computer')
    expect(new Set(items.map((item) => item.getAttribute('data-project')))).toEqual(
      new Set(publishable.map(({ id }) => id)),
    )
  })

  it('heads every sticker with the project’s name, under the section’s one h2', () => {
    const section = renderSection()

    expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(
      within(section)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.getAttribute('aria-label') ?? heading.textContent.trim()),
    ).toHaveLength(publishable.length)
    for (const { name } of publishable) {
      // A sticker may say more than the name: the button adds what it took in its first week.
      const named = (heading: string): boolean => heading.startsWith(name)
      expect(within(section).getByRole('heading', { level: 3, name: named })).toBeInTheDocument()
    }
    expect(within(section).queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('prints every description and links every address in the records', () => {
    const section = renderSection()
    const hrefs = within(section)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    for (const project of publishable) {
      const win = content.wins.find(({ id }) => id === project.winId)
      const description = project.description ?? win?.description ?? ''

      expect(description).not.toBe('')
      expect(within(section).getByText(description)).toBeInTheDocument()
      for (const { url } of project.links) {
        expect(hrefs).toContain(url)
      }
    }
  })

  it('flags the seven winners, each leading to the wins section', () => {
    const section = renderSection()
    const flags = within(section)
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/#wins')

    expect(flags).toHaveLength(publishable.filter(({ winId }) => winId !== null).length)
    expect(flags).toHaveLength(7)
  })

  it('holds back the unconfirmed project and the unverified claim', () => {
    const section = renderSection()

    expect(section).not.toHaveTextContent(/Agent Camp/)
    expect(section).not.toHaveTextContent(/world record/i)
  })

  it('names every link, and none of them twice over', () => {
    const section = renderSection()
    const names = within(section)
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label') ?? link.textContent.trim())

    for (const name of names) {
      expect(name).not.toBe('')
    }
    expect(names.filter((name) => name.endsWith('hackathon wins'))).toEqual([])
  })

  it('keeps the mat’s furniture out of a screen reader’s way, and has no inline styles', () => {
    const section = renderSection()

    for (const prop of section.querySelectorAll('[data-mat-prop]')) {
      expect(prop).toHaveAttribute('aria-hidden', 'true')
    }
    expect(section.querySelectorAll('[data-mat-prop]').length).toBeGreaterThan(0)
    expect(section.querySelector('[style]')).toBeNull()
  })
})
