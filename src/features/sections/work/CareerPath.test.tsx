import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { CareerPath } from './CareerPath'
import { workCopy } from './copy'
import { careerPath, NOW_KEY } from './path'
import { pathTotals } from './totals'

const stops = careerPath(content)

function renderPath(): HTMLElement {
  render(<CareerPath stops={stops} totals={pathTotals(content, stats)} profile={content.profile} />)
  return screen.getByRole('list', { name: workCopy.rule.list })
}

function stopItem(list: HTMLElement, key: string): HTMLElement {
  const item = list.querySelector<HTMLElement>(`:scope > li[data-stop="${key}"]`)
  if (!item) {
    throw new Error(`The path has no stop "${key}"`)
  }
  return item
}

describe('CareerPath', () => {
  it('is one ordered list, a stop to an item, newest first', () => {
    const list = renderPath()

    expect(list.tagName).toBe('OL')
    expect(
      [...list.querySelectorAll(':scope > li')].map((item) => item.getAttribute('data-stop')),
    ).toEqual(stops.map((stop) => stop.key))
  })

  it('starts at now, with the current job and the running totals', () => {
    const now = stopItem(renderPath(), NOW_KEY)

    expect(within(now).getByText(workCopy.rule.now)).toBeInTheDocument()
    expect(within(now).getByRole('article')).toHaveAttribute('data-job', 'finite-computer')
    expect(within(now).getByRole('list', { name: workCopy.totals.label })).toBeInTheDocument()
    expect(now.querySelector('time')).toBeNull()
  })

  it('engraves every year on the rule as a time', () => {
    const list = renderPath()

    for (const stop of stops.filter((candidate) => candidate.year !== null)) {
      const year = stopItem(list, stop.key).querySelector('[data-year] time')
      expect(year, stop.key).toHaveTextContent(stop.key)
      expect(year, stop.key).toHaveAttribute('datetime', stop.key)
    }
  })

  it('hangs each job from the year it began', () => {
    const list = renderPath()
    const pinned = (key: string): readonly (string | null)[] =>
      [...stopItem(list, key).querySelectorAll('article[data-job]')].map((tag) =>
        tag.getAttribute('data-job'),
      )

    expect(pinned('2024')).toEqual(['fedi'])
    expect(pinned('2023')).toEqual(['zion'])
    expect(pinned('2022')).toEqual(['blockspaces'])
    expect(pinned('2020')).toEqual(['ncr'])
    expect(pinned('2021')).toEqual([])
  })

  it('hangs the university permit from the year he began there', () => {
    const start = stopItem(renderPath(), '2018')

    expect(within(start).getByRole('article')).toHaveAttribute('data-school', 'auburn-university')
  })

  it('reads in order inside a stop: the year, what began, then what else happened', () => {
    const year = stopItem(renderPath(), '2023')
    const parts = [...year.children].map(
      (part) =>
        (part.hasAttribute('data-year') && 'year') ||
        (part.hasAttribute('data-tags') && 'tags') ||
        (part.hasAttribute('data-marks') && 'marks') ||
        part.tagName,
    )

    expect(parts).toEqual(['year', 'tags', 'marks'])
  })

  it('leaves a quiet year on the rule with nothing hanging from it', () => {
    const quiet = stopItem(renderPath(), '2019')

    expect(quiet.querySelector('article, ul, a')).toBeNull()
    expect(quiet).toHaveTextContent(/^2019$/)
  })

  it('heads every tag with an h3, and uses no other heading', () => {
    const list = renderPath()

    expect(within(list).getAllByRole('heading', { level: 3 })).toHaveLength(
      content.experience.length + content.education.length,
    )
    expect(within(list).getAllByRole('heading')).toHaveLength(
      content.experience.length + content.education.length,
    )
  })

  it('gives every job its own asset number and its own barcode', () => {
    const list = renderPath()
    const tags = [...list.querySelectorAll('article[data-job]')]
    const drawn = tags.map((tag) =>
      [...tag.querySelectorAll('svg rect')]
        .map((bar) => `${bar.getAttribute('x') ?? ''}:${bar.getAttribute('width') ?? ''}`)
        .join(' '),
    )

    expect(tags.map((tag) => tag.querySelector('[data-asset]')?.textContent)).toEqual([
      '0005',
      '0004',
      '0003',
      '0002',
      '0001',
    ])
    expect(new Set(drawn).size).toBe(tags.length)
  })

  it('labels the rule’s unit for the eye only', () => {
    const list = renderPath()
    const unit = within(list.parentElement ?? list).getByText(workCopy.rule.unit)

    expect(unit.closest('[aria-hidden="true"]')).not.toBeNull()
  })
})
