import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import { publishableProjects } from '../../content/derive'
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
      ...content.wins.flatMap((win) => [win.project, win.event]),
      ...content.organized.map((event) => event.name),
      ...content.talks.map((talk) => talk.title),
      ...publishableProjects(content.projects).map((project) => project.name),
      ...content.press.flatMap((item) => [item.outlet, item.title ?? '']),
      ...content.education.map((entry) => entry.institution),
      content.profile.email,
      ...content.profile.links.map((link) => link.label),
    ]
    for (const value of expected) {
      expect(text).toContain(value)
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
