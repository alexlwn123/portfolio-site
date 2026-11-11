import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { organizedCopy } from './copy'
import { eventLabels } from './eventLabels'
import { Wristbands } from './Wristbands'

const labels = eventLabels(content)

function renderArm(): HTMLElement {
  return render(<Wristbands events={content.organized} labels={labels} />).container
}

function rows(): readonly HTMLElement[] {
  const list = screen.getByRole('list', { name: organizedCopy.listLabel })
  return [...list.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
}

describe('Wristbands', () => {
  it('is one numbered list, newest first, counting down to the first he ran', () => {
    renderArm()
    const list = screen.getByRole('list', { name: organizedCopy.listLabel })

    expect(list.tagName).toBe('OL')
    expect(list).toHaveAttribute('reversed')
    expect(rows()).toHaveLength(content.organized.length)
    expect(rows().every((row) => row.tagName === 'LI')).toBe(true)
  })

  it('puts a band and its label in every row, in the record’s order', () => {
    renderArm()

    const names = rows().map((row) => within(row).getByRole('heading', { level: 3 }).textContent)
    expect(names).toEqual(content.organized.map(({ name }) => name))
    for (const [index, row] of rows().entries()) {
      expect(row.querySelector('[data-band]'), names[index]).not.toBeNull()
      expect(row.querySelector('time'), names[index]).not.toBeNull()
    }
  })

  it('numbers the bands down from the next one to the first', () => {
    renderArm()

    const numbers = rows().map((row) => row.querySelector('[aria-hidden="true"]')?.textContent)
    expect(numbers[0]).toBe(String(stats.organized.nextNumber))
    expect(numbers[1]).toBe(String(stats.organized.count))
    expect(numbers.at(-1)).toBe('1')
  })

  it('letters the labels on alternating sides, starting on the right', () => {
    renderArm()

    const sides = rows().map((row) => row.getAttribute('data-side'))
    expect(sides.slice(0, 4)).toEqual(['right', 'left', 'right', 'left'])
    expect(new Set(sides)).toEqual(new Set(['left', 'right']))
  })

  it('leaves the next hackathon’s band blank and gives every held one a printed band', () => {
    renderArm()

    const kinds = rows().map((row) => row.querySelector('[data-band]')?.getAttribute('data-band'))
    expect(kinds[0]).toBe('blank')
    expect(kinds.slice(1)).not.toContain('blank')
    expect(kinds.filter((kind) => kind === 'foil')).toHaveLength(1)
  })

  it('draws the forearm for the eye only', () => {
    const arm = renderArm()
    const forearm = arm.querySelector('[data-forearm]')

    expect(forearm).toHaveAttribute('aria-hidden', 'true')
    expect(forearm).toHaveTextContent('')
  })

  it('leaves room for more at the elbow, with a drawn arrow', () => {
    const arm = renderArm()
    const tattoo = screen.getByText(organizedCopy.roomForMore)

    expect(tattoo.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    expect(arm.textContent).not.toMatch(/[←-⇿✦]/)
  })

  it('has one link in all: the press piece', () => {
    renderArm()

    expect(screen.getAllByRole('link')).toHaveLength(
      content.press.filter(({ subject }) => subject.kind === 'organizedEvent').length,
    )
  })
})
