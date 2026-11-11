import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { publishablePatents, publishableProjects } from '../../content/derive'
import { winName } from '../../content/winName'
import { PATHS } from '../../lib/paths'
import { CvPage } from './CvPage'
import { SECTIONS } from './labels'

function renderPage() {
  return render(<CvPage content={content} stats={stats} />)
}

describe('CvPage', () => {
  it('has exactly one h1, and it is his name', () => {
    renderPage()

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(content.profile.name)
  })

  it('has banner, navigation, main and footer landmarks', () => {
    renderPage()

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('gives every section its stable id, in order, with a heading that labels it', () => {
    const { container } = renderPage()

    const sections = [...container.querySelectorAll('main > section')]
    expect(sections.map((section) => section.id)).toEqual([
      'experience',
      'wins',
      'organized',
      'talks',
      'projects',
      'patents',
      'press',
      'education',
      'contact',
    ])
    for (const { id, title } of SECTIONS) {
      expect(screen.getByRole('region', { name: title })).toHaveAttribute('id', id)
    }
  })

  it('links the section navigation to every section', () => {
    renderPage()

    const nav = screen.getByRole('navigation', { name: 'Sections' })
    const targets = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(targets).toEqual(SECTIONS.map(({ id }) => `#${id}`))
  })

  it('links back to the home page', () => {
    renderPage()

    const homeLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === PATHS.home)
    expect(homeLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('offers a skip link to the main content', () => {
    renderPage()

    const skip = screen.getAllByRole('link')[0]
    expect(skip).toHaveAttribute('href', '#content')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'content')
  })

  it('shows every content record', () => {
    renderPage()
    const text = document.body.textContent

    const expected = [
      ...content.experience.flatMap((role) => [role.organization, role.title]),
      ...content.wins.flatMap((win) => [winName(win), win.event]),
      ...content.organized.map((event) => event.name),
      ...content.talks.map((talk) => talk.title),
      ...publishableProjects(content.projects).map((project) => project.name),
      ...publishablePatents(content.patents).flatMap((patent) => [
        patent.title,
        patent.number.serial,
      ]),
      ...content.press.flatMap((item) => [item.outlet, item.title ?? '']),
      ...content.education.map((entry) => entry.institution),
      content.profile.email,
      ...content.profile.links.map((link) => link.label),
    ]
    for (const value of expected) {
      expect(text).toContain(value)
    }
  })

  it('shows the ninth win, the corrected AI4All row, the merged talk and the new talks', () => {
    renderPage()
    const text = document.body.textContent
    const talks = within(screen.getByRole('region', { name: 'Talks, workshops and panels' }))
    const sovereignBanks = talks
      .getAllByRole('listitem')
      .filter((item) => item.textContent.includes('Sovereign Banks'))

    expect(text).toContain('9 wins: 6 first places, 2 second places and 1 prize.')
    expect(text).toContain('Team Eth Heads')
    expect(text).toContain('Prize winner: Bitcoin Education Track')
    expect(text).toContain('Jul 1–31, 2023')
    expect(sovereignBanks).toHaveLength(1)
    expect(sovereignBanks[0]).toHaveTextContent('Dec 15, 2025')
    expect(text).toContain('The Alex Lewin Experience')
    expect(text).toContain('Big Dev Energy with Alex Lewin')
  })

  it('has a patents section that lists granted patents and the pending application only', () => {
    const { container } = renderPage()
    const patents = container.querySelector('#patents')

    expect(patents).toHaveTextContent('US 12,536,579 B2')
    expect(patents).toHaveTextContent('US 12,354,083 B2')
    expect(patents).toHaveTextContent('Application US 2023/0032782 A1')
    expect(document.body.textContent).not.toMatch(/2024\/0037539|non-fungible/i)
  })

  it('names the right number of events beside each total', () => {
    renderPage()
    const text = document.body.textContent

    expect(text).toContain('The 12 events with a public head count add up to 1,471 participants.')
    expect(text).toContain('The 14 events with a public prize figure add up to $263,525 in prizes.')
    expect(text).not.toMatch(/12 events with public figures/)
  })

  it('links to his live LinkedIn profile', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/alex-lewin1/',
    )
  })

  it('never prints where a record came from: the sources are for his review', () => {
    renderPage()
    const text = document.body.textContent

    expect(text).not.toMatch(/publicRecord|public record/i)
    for (const win of content.wins) {
      if (win.source.kind === 'publicRecord') {
        expect(text).not.toContain(win.source.note)
      }
    }
  })

  it('links to every press item', () => {
    const { container } = renderPage()

    for (const item of content.press) {
      expect(container.querySelector(`#press a[href="${item.url}"]`)).not.toBeNull()
    }
  })

  it('renders nothing for unknown values', () => {
    renderPage()

    expect(document.body.textContent).not.toMatch(
      /\b(null|undefined|NaN|unknown|not known|not recorded|not public|not announced|n\/a|tbd)\b/i,
    )
  })

  it('uses real links: every anchor has a destination', () => {
    const { container } = renderPage()

    const anchors = [...container.querySelectorAll('a')]
    expect(anchors.length).toBeGreaterThan(40)
    for (const anchor of anchors) {
      expect(anchor.getAttribute('href')).toMatch(/^(https:\/\/|mailto:|\/|#)/)
    }
  })

  it('carries no inline styles, scripts or event handlers', () => {
    const { container } = renderPage()

    expect(container.querySelectorAll('script, style, [style], [onclick]')).toHaveLength(0)
  })

  it('never prints an editorial caveat or an unverified claim', () => {
    renderPage()
    const text = document.body.textContent

    for (const win of content.wins) {
      if (win.caveat !== null) {
        expect(text).not.toContain(win.caveat)
      }
    }
    expect(text).not.toMatch(/world records/i)
  })
})
