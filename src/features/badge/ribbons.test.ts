import { describe, expect, it } from 'vitest'

import { isPinned, type LinkRibbon, type PinnedRibbon, ribbonHrefs } from './ribbons'

const engineer: LinkRibbon = { label: 'ENGINEER', href: '/#work', tone: 'ink' }
const hackathons: PinnedRibbon = {
  label: 'HACKATHONS',
  tone: 'hi',
  pins: [
    { label: 'WINNER', count: '×9', href: '/#wins', tone: 'ink' },
    { label: 'ORGANIZER', count: '×16', href: '/#organized', tone: 'tang' },
  ],
}

describe('isPinned', () => {
  it('tells a ribbon that carries pins from one that is a link itself', () => {
    expect(isPinned(hackathons)).toBe(true)
    expect(isPinned(engineer)).toBe(false)
  })
})

describe('ribbonHrefs', () => {
  it('is the one address of a ribbon that is a link', () => {
    expect(ribbonHrefs(engineer)).toEqual(['/#work'])
  })

  it('is the address of each pin, in order, for a ribbon that carries pins', () => {
    expect(ribbonHrefs(hackathons)).toEqual(['/#wins', '/#organized'])
  })

  it('is nothing for a ribbon whose pins have all come off', () => {
    expect(ribbonHrefs({ ...hackathons, pins: [] })).toEqual([])
  })
})
