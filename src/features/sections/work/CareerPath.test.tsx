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

  it('sticks the university permit down with the rest, at the year he began there', () => {
    const start = stopItem(renderPath(), '2018')
    const permit = within(start).getByRole('article')

    expect(permit).toHaveAttribute('data-school', 'auburn-university')
    expect(permit.closest('[data-aside]')).not.toBeNull()
    expect(start.querySelector('[data-tags]')).toBeNull()
  })

  it('reads in order inside a stop: the year, what began, then what else happened', () => {
    const year = stopItem(renderPath(), '2023')
    const parts = [...year.children].map(
      (part) =>
        (part.hasAttribute('data-year') && 'year') ||
        (part.hasAttribute('data-tags') && 'tags') ||
        (part.hasAttribute('data-aside') && 'aside') ||
        part.tagName,
    )

    expect(parts).toEqual(['year', 'tags', 'aside'])
    expect(year.querySelector('[data-aside] > [data-marks]')).not.toBeNull()
  })

  it('leaves a quiet year on the rule with nothing hanging from it, and marks it as a break', () => {
    const list = renderPath()
    const quiet = stopItem(list, '2019')

    expect(quiet.querySelector('article, ul, a, [data-aside], [data-tags]')).toBeNull()
    expect(quiet).toHaveTextContent(/^2019$/)
    expect(quiet).toHaveAttribute('data-quiet', '')
    expect(list.querySelectorAll('[data-quiet]')).toHaveLength(1)
  })

  it('lets a tag hang past the years after it in which no other job began', () => {
    const list = renderPath()
    const past = (key: string): string | null | undefined =>
      stopItem(list, key).querySelector('[data-tags]')?.getAttribute('data-past')

    expect(past(NOW_KEY)).toBe('2')
    expect(past('2024')).toBe('0')
    expect(past('2023')).toBe('0')
    expect(past('2022')).toBe('1')
    expect(past('2020')).toBe('2')
  })

  it('sets what else happened down the side of a tag with no room, beside one with room, and abreast where no job began', () => {
    const list = renderPath()
    const layout = (key: string): string | null | undefined =>
      stopItem(list, key).querySelector('[data-marks]')?.getAttribute('data-layout')

    expect(layout('2024')).toBe('down')
    expect(layout('2023')).toBe('down')
    expect(layout('2022')).toBe('beside')
    expect(layout('2020')).toBe('beside')
    expect(layout('2026')).toBe('abreast')
    expect(layout('2021')).toBe('abreast')
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

  it('labels the rule’s unit for the eye only, at its foot', () => {
    const list = renderPath()
    const unit = within(list.parentElement ?? list).getByText(workCopy.rule.unit)

    expect(unit.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(unit.closest('[data-rule-foot]')).not.toBeNull()
  })
})
