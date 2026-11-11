import { describe, expect, it } from 'vitest'

import { content } from './index'
import { publicRecordItems } from './review'

const items = publicRecordItems(content)

describe('publicRecordItems', () => {
  it('lists, as one group, every record that web research added or corrected', () => {
    expect(items.map((item) => item.record)).toEqual([
      'profile.links.linkedin',
      'education.auburn-university',
      'wins.stringer-safety',
      'wins.bitdevs-upgrade',
      'organized.ai-hack-for-freedom-iv',
      'organized.ai-hack-for-freedom-iii',
      'organized.btcpp-toronto-2026',
      'organized.ai-hack-for-freedom-ii',
      'organized.btcpp-florianopolis-2026',
      'organized.auburnhacks-2021',
      'talks.the-alex-lewin-experience',
      'talks.bitcoin-takeover-s17-e46',
      'talks.teaching-ai-as-a-tool-for-freedom',
      'talks.elevating-the-ux-of-self-custody',
      'talks.lightning-plus-ecash',
      'talks.sovereign-banks-fedi',
      'talks.fedimint-sdk-workshop',
      'talks.how-ecash-works',
      'talks.extending-bitcoin-with-zk-proofs',
      'talks.ai-unchained-003',
      'talks.state-of-bitcoin-67',
      'talks.bitdevs-radio-hour',
    ])
  })

  it('says for each what the research changed', () => {
    for (const item of items) {
      expect(item.note.trim(), item.record).not.toBe('')
    }
  })

  it('gives the page each was found on, except the one date that came without one', () => {
    const unsourced = items.filter((item) => item.urls.length === 0)

    expect(unsourced.map((item) => item.record)).toEqual(['talks.fedimint-sdk-workshop'])
    for (const url of items.flatMap((item) => item.urls)) {
      expect(url).toMatch(/^https:\/\//)
    }
  })

  it('leaves out what he stated himself, the ninth win and the patents included', () => {
    const records = items.map((item) => item.record)

    expect(records).not.toContain('wins.ncr-global-hackathon-2021')
    expect(records.filter((record) => record.startsWith('patents.'))).toEqual([])
  })

  it('is empty when nothing came from research', () => {
    const owned = {
      profile: { links: [] },
      education: [],
      wins: content.wins.filter((win) => win.source.kind === 'owner'),
      organized: [],
      talks: [],
    }

    expect(publicRecordItems(owned)).toEqual([])
  })
})
