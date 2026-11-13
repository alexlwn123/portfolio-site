import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { HeldEvent, Organized, UpcomingEvent } from '../../../content'
import { heldEvents } from '../../../content/derive'
import { pressClaim } from '../../../content/pressClaim'
import { organizedCopy } from './copy'
import { type EventLabel, eventLabels } from './eventLabels'

const labels = eventLabels(content)

function label(id: string): EventLabel {
  const found = labels.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No label for the hackathon "${id}"`)
  }
  return found
}

function record(id: string): Organized {
  const found = content.organized.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No hackathon has the id "${id}"`)
  }
  return found
}

/** The labels for a record changed for the test, alone in the list. */
function labelOf(event: Organized): EventLabel {
  const [only] = eventLabels({ ...content, organized: [event] })
  if (!only) {
    throw new Error('Expected one label')
  }
  return only
}

const chipTexts = (id: string): readonly string[] => label(id).chips.map(({ text }) => text)

describe('eventLabels', () => {
  it('has a label for every hackathon in the record, in the record’s order', () => {
    expect(labels.map(({ id }) => id)).toEqual(content.organized.map(({ id }) => id))
    expect(labels.map(({ name }) => name)).toEqual(content.organized.map(({ name }) => name))
  })

  it('numbers them from the first he ran, so the newest held carries the count', () => {
    const held = labels.filter(({ upcoming }) => !upcoming)

    expect(label('auburnhacks-2020').number).toBe(1)
    expect(label('auburnhacks-2021').number).toBe(2)
    expect(held[0]?.number).toBe(stats.organized.count)
    expect(held.map(({ number }) => number)).toEqual(
      Array.from({ length: held.length }, (_, index) => held.length - index),
    )
  })

  it('gives the upcoming hackathon the next number, and never a figure', () => {
    const next = label('ai-hack-for-freedom-iv')

    expect(next.upcoming).toBe(true)
    expect(next.number).toBe(stats.organized.nextNumber)
    expect(next.chips).toEqual([])
    expect(next.scrawl).toBe(organizedCopy.blank)
  })

  it('numbers a second upcoming hackathon after the first', () => {
    const later: UpcomingEvent = {
      ...(record('ai-hack-for-freedom-iv') as UpcomingEvent),
      id: 'one-more',
      date: null,
      location: null,
    }
    const numbered = eventLabels({ ...content, organized: [later, ...content.organized] })

    expect(numbered[0]?.number).toBe(stats.organized.nextNumber + 1)
    expect(numbered[1]?.number).toBe(stats.organized.nextNumber)
    expect(numbered[0]?.place).toBeNull()
    expect(numbered[0]?.date).toBeNull()
    expect(numbered[0]?.where).toBe(organizedCopy.notAnnounced)
  })

  it('letters the city, with its state where the record has one', () => {
    expect(label('ai-hack-for-freedom-iii').place).toBe('Washington, DC')
    expect(label('btcpp-toronto-2026').place).toBe('Toronto')
    expect(label('btcpp-florianopolis-2025').place).toBe('Florianópolis')
    expect(label('ai-hack-for-freedom-iv').place).toBe('San Francisco, CA')
  })

  it('follows the date with the country, or with what an online event was for', () => {
    expect(label('btcpp-nairobi-2026').where).toBe('Kenya')
    expect(label('btcpp-istanbul-2025').where).toBe('Türkiye')
    expect(label('bitcoin-2025-official-hackathon').place).toBe(organizedCopy.online)
    expect(label('bitcoin-2025-official-hackathon').where).toBe(
      'for the Bitcoin 2025 conference in Las Vegas',
    )
    expect(label('auburnhacks-2021').place).toBe(organizedCopy.online)
    expect(label('auburnhacks-2021').where).toBeNull()
  })

  it('carries the record’s own date, to be printed as it stands', () => {
    for (const event of content.organized) {
      expect(label(event.id).date).toEqual(event.date)
    }
  })

  it('prints an exact head count and a dollar prize as the record has them', () => {
    expect(chipTexts('btcpp-nairobi-2026')).toEqual(['90 participants', '$6,180 prizes'])
    expect(chipTexts('bitcoin-2025-official-hackathon')).toEqual([
      '832 participants',
      '$58,750 prizes',
    ])
    expect(chipTexts('auburnhacks-2020')).toEqual(['112 participants', '$6,340 prizes'])
  })

  it('counts an event in teams when that is what the record counts', () => {
    expect(chipTexts('ai-hack-for-freedom-iii')).toEqual(['10 teams', '$50,000 prizes'])
    expect(chipTexts('ai-hack-for-freedom-ii')).toEqual(['8 teams', '$50,000 prizes'])
  })

  it('says "about" for an approximate head count, and leaves out a prize nobody published', () => {
    expect(chipTexts('btcpp-florianopolis-2026')).toEqual(['about 60 participants', '21 projects'])
  })

  it('keeps a prize in sats in sats, and leaves out a head count nobody published', () => {
    expect(chipTexts('btcpp-toronto-2026')).toEqual(['16 projects', '17.542M sats in prizes'])
  })

  it('words a non-monetary prize as one, with no amount', () => {
    const turbo = label('btcpp-ai-turbo-austin-2025')

    expect(turbo.chips.map(({ text }) => text)).toEqual([
      '21 participants',
      organizedCopy.nonMonetary,
    ])
    expect(turbo.chips.at(-1)?.text).not.toMatch(/\d|\$/)
  })

  it('prints no pill at all when no figure was published', () => {
    const silent: HeldEvent = {
      ...(record('btcpp-toronto-2026') as HeldEvent),
      participants: null,
      prizes: null,
      projects: null,
    }

    expect(labelOf(silent).chips).toEqual([])
  })

  it('puts the counts first, then the prize, and never a pill for what is not on record', () => {
    expect(label('btcpp-toronto-2026').chips.map(({ kind }) => kind)).toEqual(['count', 'prize'])
    for (const event of heldEvents(content.organized)) {
      expect(JSON.stringify(label(event.id).chips), event.id).not.toMatch(/not public/i)
    }
  })

  it('adds a line more where the record has one: his role, and its own note', () => {
    expect(label('auburnhacks-2021').about).toEqual(['Executive director'])
    expect(label('btcpp-ai-turbo-austin-2025').about).toEqual(['Two hours, during SXSW'])
    expect(label('ai-hack-for-freedom-iii').about).toEqual(['Prizes paid in bitcoin'])
    expect(label('btcpp-riga-2025').about).toEqual([])
  })

  it('writes nothing by hand beside a hackathon that has been held, his own win there included', () => {
    const own = content.wins.flatMap((win) => win.alsoOrganizedId ?? [])

    expect(own).toEqual(['btcpp-berlin-2024'])
    for (const event of heldEvents(content.organized)) {
      expect(label(event.id).scrawl, event.id).toBeNull()
    }
  })

  it('links the NPR piece from the hackathon it covered, in the claim’s own words', () => {
    const [npr] = content.press
    if (npr?.subject.kind !== 'organizedEvent') {
      throw new Error('Expected the first press item to cover a hackathon')
    }
    const claim = pressClaim(npr, content)

    expect(label(npr.subject.organizedId).press).toEqual([
      {
        label: organizedCopy.coveredBy('NPR'),
        href: npr.url,
        claim: claim.claim,
      },
    ])
  })

  it('attaches press to no other hackathon', () => {
    const covered = labels.filter(({ press }) => press.length > 0)

    expect(covered.map(({ id }) => id)).toEqual(['ai-hack-for-freedom-iii'])
  })

  it('adds up to the totals the section prints: nothing is counted twice or left out', () => {
    const exact = heldEvents(content.organized).filter(
      ({ participants }) => participants?.unit === 'people',
    )

    expect(exact).toHaveLength(stats.organized.headCountEvents)
    expect(labels.filter(({ upcoming }) => !upcoming)).toHaveLength(stats.organized.count)
  })
})
