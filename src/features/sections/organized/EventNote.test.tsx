import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { organizedCopy } from './copy'
import { type EventLabel, eventLabels } from './eventLabels'
import { EventNote } from './EventNote'

const labels = eventLabels(content)

function label(id: string): EventLabel {
  const found = labels.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No label for the hackathon "${id}"`)
  }
  return found
}

function renderNote(id: string): HTMLElement {
  return render(<EventNote label={label(id)} />).container
}

describe('EventNote', () => {
  it('letters the city, then the date and the country', () => {
    const note = renderNote('btcpp-nairobi-2026')

    expect(note).toHaveTextContent(/^Nairobi\s*Jun 17–18, 2026 · Kenya/)
    expect(note.querySelector('time')).toHaveAttribute('datetime', '2026-06-17')
    expect(note.querySelector('time')).toHaveTextContent('Jun 17–18, 2026')
  })

  it('prints a date known only to the month as a month', () => {
    const note = renderNote('btcpp-toronto-2026')

    expect(note.querySelector('time')).toHaveAttribute('datetime', '2026-07')
    expect(note).toHaveTextContent('Jul 2026 · Canada')
  })

  it('lists the figures as a list, each marked for what it is', () => {
    renderNote('btcpp-toronto-2026')

    const chips = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(chips.map((chip) => chip.textContent)).toEqual(['16 projects', '17.542M sats in prizes'])
    expect(chips.map((chip) => chip.getAttribute('data-chip'))).toEqual(['count', 'prize'])
  })

  it('adds the line more that the record has', () => {
    expect(renderNote('auburnhacks-2021')).toHaveTextContent('Executive director')
    expect(renderNote('btcpp-ai-turbo-austin-2025')).toHaveTextContent('Two hours, during SXSW')
  })

  it('says what an online hackathon was for', () => {
    const note = renderNote('bitcoin-2025-official-hackathon')

    expect(note).toHaveTextContent(
      /^Online\s*Apr 8 – May 20, 2025 · for the Bitcoin 2025 conference in Las Vegas/,
    )
  })

  it('links the NPR piece, named by the claim, and says no more about it', () => {
    const note = renderNote('ai-hack-for-freedom-iii')
    const [press] = label('ai-hack-for-freedom-iii').press
    const link = screen.getByRole('link')

    expect(link).toHaveAttribute('href', press?.href)
    expect(link).toHaveAccessibleName(`covered by NPR: ${press?.claim ?? ''}`)
    expect(link).toHaveAttribute('aria-label', `covered by NPR: ${press?.claim ?? ''}`)
    expect(note.textContent).not.toMatch(/as heard on|featured on|names neither|does not name/i)
  })

  it('has no link where there is no press', () => {
    renderNote('btcpp-riga-2025')

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('writes nothing by hand beside one that has been held, the one he also won included', () => {
    expect(renderNote('btcpp-berlin-2024')).not.toHaveTextContent(/awkward|also won/i)
  })

  it('says the next one is upcoming, with its dates, and to save the date', () => {
    const note = renderNote('ai-hack-for-freedom-iv')

    expect(note).toHaveTextContent(/^San Francisco, CA\s*upcoming · Dec 2–4, 2026 · USA/)
    expect(note).toHaveTextContent(organizedCopy.blank)
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('says so when an upcoming hackathon has neither a date nor a place', () => {
    const unannounced: EventLabel = {
      ...label('ai-hack-for-freedom-iv'),
      place: null,
      date: null,
      where: organizedCopy.notAnnounced,
    }
    const { container } = render(<EventNote label={unannounced} />)

    expect(container).toHaveTextContent(/^upcoming · not announced/)
    expect(container.querySelector('time')).toBeNull()
  })

  it('types no arrow: the one on the press link is drawn', () => {
    const note = renderNote('ai-hack-for-freedom-iii')

    expect(note.textContent).not.toMatch(/[←-⇿]/)
    expect(screen.getByRole('link').querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })
})
