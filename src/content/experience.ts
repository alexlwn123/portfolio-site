import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { educationSchema, experienceSchema } from './schema'
import { fromPublicRecord } from './source'

/*
 * Start dates come from the current site's timeline. End dates are not
 * recorded anywhere, so every `end` is null. Descriptions are his own words.
 */
const experienceRecords: readonly z.input<typeof experienceSchema>[] = [
  {
    id: 'finite-computer',
    organization: 'Finite Computer',
    title: 'Minister of Development',
    team: null,
    start: null,
    end: null,
    current: true,
    description:
      'Open-source AI agent platform spanning chat, private compute, hosted sites, search, and skills.',
  },
  {
    id: 'fedi',
    organization: 'Fedi',
    title: 'Senior Software Engineer',
    team: null,
    start: { year: 2024, month: 3, day: null },
    end: null,
    current: false,
    description: 'Building a community focused super app and developer tooling for fedimint',
  },
  {
    id: 'zion',
    organization: 'Zion',
    title: 'Full Stack Engineer',
    team: null,
    start: { year: 2023, month: 11, day: null },
    end: null,
    current: false,
    description: 'Building applications involving Decentralized Identity',
  },
  {
    id: 'blockspaces',
    organization: 'BlockSpaces',
    title: 'Full Stack Engineer',
    team: null,
    start: { year: 2022, month: 5, day: null },
    end: null,
    current: false,
    description: 'My first exposure to the start-up world',
  },
  {
    id: 'ncr',
    organization: 'NCR Corporation',
    title: 'Software Engineer',
    team: 'Software Innovation Lab',
    start: { year: 2020, month: 5, day: null },
    end: null,
    current: false,
    description: null,
  },
]

const educationRecords: readonly z.input<typeof educationSchema>[] = [
  {
    id: 'auburn-university',
    institution: 'Auburn University',
    level: 'Undergraduate',
    subject: 'Software Engineering',
    start: { year: 2018, month: 8, day: null },
    // His LinkedIn profile lists 2018 to 2021. It states no degree, so no graduation is claimed.
    end: { year: 2021, month: null, day: null },
    graduated: null,
    source: fromPublicRecord(
      'The last year, 2021, was added from his LinkedIn profile. Whether he graduated is still not recorded.',
      'https://www.linkedin.com/in/alex-lewin1/',
    ),
  },
]

export const experience = parseContent(
  recordList(experienceSchema),
  experienceRecords,
  'experience',
)

export const education = parseContent(recordList(educationSchema), educationRecords, 'education')
