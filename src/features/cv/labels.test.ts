import { describe, expect, it } from 'vitest'

import { LABELS, SECTIONS, type SectionId, sectionTitle } from './labels'

describe('CV labels', () => {
  it('lists the nine sections with stable ids, in page order', () => {
    expect(SECTIONS.map(({ id }) => id)).toEqual([
      'experience',
      'wins',
      'organized',
      'talks',
      'projects',
      'patents',
      'press',
      'education',
      'contact',
    ])
  })

  it('finds the title of a section', () => {
    expect(sectionTitle('organized')).toBe('Hackathons organized')
    expect(sectionTitle('patents')).toBe('Patents')
  })

  it('refuses a section that does not exist', () => {
    expect(() => sectionTitle('hobbies' as SectionId)).toThrow(/Unknown CV section "hobbies"/)
  })

  it('holds no numbers: figures come from the content module', () => {
    const texts = [...Object.values(LABELS), ...SECTIONS.map(({ title }) => title)]

    expect(texts.filter((text) => /\d/.test(text))).toEqual([])
  })

  it('has no word for what became of a patent filing: only that it was filed', () => {
    expect(
      Object.values(LABELS).filter((text) => /grant|pending|abandon|application/i.test(text)),
    ).toEqual([])
    expect(LABELS.filed).toBe('Filed')
  })
})
