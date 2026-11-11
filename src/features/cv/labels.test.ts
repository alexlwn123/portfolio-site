import { describe, expect, it } from 'vitest'

import { LABELS, SECTIONS, type SectionId, sectionTitle } from './labels'

describe('CV labels', () => {
  it('lists the eight sections with stable ids, in page order', () => {
    expect(SECTIONS.map(({ id }) => id)).toEqual([
      'experience',
      'wins',
      'organized',
      'talks',
      'projects',
      'press',
      'education',
      'contact',
    ])
  })

  it('finds the title of a section', () => {
    expect(sectionTitle('organized')).toBe('Hackathons organized')
  })

  it('refuses a section that does not exist', () => {
    expect(() => sectionTitle('hobbies' as SectionId)).toThrow(/Unknown CV section "hobbies"/)
  })

  it('holds no numbers: figures come from the content module', () => {
    const texts = [...Object.values(LABELS), ...SECTIONS.map(({ title }) => title)]

    expect(texts.filter((text) => /\d/.test(text))).toEqual([])
  })
})
