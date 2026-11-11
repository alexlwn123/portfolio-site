import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { publishableProjects } from '../../../content/derive'
import { ProjectsSection } from './ProjectsSection'

function renderSection() {
  render(<ProjectsSection projects={content.projects} wins={content.wins} />)
  return within(screen.getByRole('region', { name: 'Projects' }))
}

function projectItem(name: string): HTMLElement {
  const item = screen
    .getAllByRole('listitem')
    .find((candidate) => candidate.textContent.startsWith(name))
  if (!item) {
    throw new Error(`No list item starts with "${name}"`)
  }
  return item
}

describe('ProjectsSection', () => {
  it('lists every confirmed project in the order of his profile', () => {
    const section = renderSection()
    const publishable = publishableProjects(content.projects)

    const items = section.getAllByRole('listitem')
    expect(items).toHaveLength(publishable.length)
    publishable.forEach((project, index) => {
      expect(items[index]).toHaveTextContent(project.name)
    })
  })

  it('holds back the project that is still to be confirmed', () => {
    const section = renderSection()

    expect(section.queryByText(/Agent Camp/)).toBeNull()
  })

  it('links to the win and to every project link', () => {
    renderSection()
    const plebFm = projectItem('Pleb FM')

    const links = within(plebFm)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(links).toEqual([
      '#wins',
      'https://pleb.fm',
      'https://github.com/PlebFM/PlebFM',
      'https://youtu.be/_AwXSzzc9k0?t=839',
    ])
  })

  it('takes the description of a winning project from its win, and says what it won', () => {
    renderSection()
    const welder = projectItem('Lightning Welder')

    expect(welder).toHaveTextContent('Helps legacy Lightning wallets pay BOLT12 offers.')
    expect(welder).toHaveTextContent('Hackathon win: 1st overall, bitcoin++ Berlin, ecash edition')
  })

  it('shows the note the file gives', () => {
    renderSection()

    expect(projectItem('Finite Computer')).toHaveTextContent('His employer.')
  })

  it('leaves the unverified Chesscup claim off the page', () => {
    renderSection()

    expect(projectItem('Chesscup Hack')).not.toHaveTextContent(/record/i)
  })

  it('gives each link a name that says which project it belongs to', () => {
    renderSection()

    expect(screen.getByRole('link', { name: 'Code: BTC Plinko' })).toHaveAttribute(
      'href',
      'https://github.com/alexlwn123/btc-plinko',
    )
  })

  it('skips the win line when a project points at a win that is not there', () => {
    render(<ProjectsSection projects={content.projects} wins={[]} />)

    expect(screen.getByRole('region')).not.toHaveTextContent('Hackathon win')
  })
})
