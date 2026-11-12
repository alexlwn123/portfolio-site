import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { WorkSection } from './WorkSection'

function renderSection(): HTMLElement {
  render(<WorkSection content={content} stats={stats} />)
  return screen.getByRole('region', { name: /^Career\s*path$/ })
}

describe('WorkSection', () => {
  it('is the work section, on the cutting mat, with a line in his hand under the title', () => {
    const section = renderSection()

    expect(section).toHaveAttribute('id', 'work')
    expect(section).toHaveAttribute('data-surface', 'mat')
    expect(
      within(section).getByText('5 roles, from NCR Corporation to Finite Computer. newest first.'),
    ).toBeInTheDocument()
  })

  it('prints every job on record: who for, as what', () => {
    const section = renderSection()

    for (const role of content.experience) {
      const tag = section.querySelector<HTMLElement>(`article[data-job="${role.id}"]`)
      expect(tag, role.id).toHaveTextContent(role.organization)
      expect(tag, role.id).toHaveTextContent(role.title)
    }
    expect(section.querySelectorAll('article[data-job]')).toHaveLength(content.experience.length)
  })

  it('puts the current job first and marks no other as current', () => {
    const tags = [...renderSection().querySelectorAll('article[data-job]')]

    expect(tags[0]).toHaveAttribute('data-job', 'finite-computer')
    expect(tags.filter((tag) => tag.hasAttribute('data-current'))).toHaveLength(1)
  })

  it('prints a start for every dated job and an end for none', () => {
    const section = renderSection()
    const starts = [...section.querySelectorAll('article[data-job] time')].map((time) =>
      time.getAttribute('datetime'),
    )

    expect(starts).toEqual(['2024-03', '2023-11', '2022-05', '2020-05'])
    for (const tag of section.querySelectorAll('article[data-job]')) {
      expect(tag.textContent).not.toMatch(/–|—|until|present/i)
    }
  })

  it('prints the university, the subject and the years, and no degree', () => {
    const permit = renderSection().querySelector('article[data-school]')

    expect(permit).toHaveTextContent('Auburn University')
    expect(permit).toHaveTextContent('Software Engineering')
    expect(permit).toHaveTextContent('2018 – 2021')
    expect(permit?.textContent).not.toMatch(/degree|\bgraduat/i)
  })

  it('links to every other part of the career, and only to sections of this page', () => {
    const hrefs = within(renderSection())
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    expect(new Set(hrefs)).toEqual(
      new Set(['/#wins', '/#organized', '/#talks', '/#projects', '/#patents']),
    )
  })

  it('gives every link a name', () => {
    for (const link of within(renderSection()).getAllByRole('link')) {
      expect(link).toHaveAccessibleName(/\S/)
    }
  })

  it('adds no heading above the tags’ own, and no second h2', () => {
    const section = renderSection()

    expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(within(section).queryAllByRole('heading', { level: 4 })).toHaveLength(0)
  })

  it('carries no inline style', () => {
    expect(renderSection().querySelector('[style]')).toBeNull()
  })
})
