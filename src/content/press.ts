import type { z } from 'zod'

import { parseContent, recordList } from './parse'
import { pressSchema } from './schema'

const records: readonly z.input<typeof pressSchema>[] = [
  {
    id: 'npr-all-things-considered',
    outlet: 'NPR',
    programme: 'All Things Considered',
    date: { year: 2026, month: 10, day: 27 },
    title: 'Human rights activists look to harness AI for the greater good',
    reporter: 'Jenna McLaughlin',
    url: 'https://www.npr.org/2026/10/27/nx-s1-5983462/human-rights-activists-look-to-harness-ai-for-the-greater-good',
    // The piece describes the hackathon and names neither the event nor him.
    // The accurate claim is that a hackathon he helped organize was covered.
    subject: {
      kind: 'organizedEvent',
      organizedId: 'ai-hack-for-freedom-iii',
      namesEvent: false,
      namesOwner: false,
    },
  },
  {
    id: 'hrf-winners-announcement',
    outlet: 'Human Rights Foundation',
    programme: null,
    date: { year: 2026, month: 1, day: 21 },
    title: 'Announcing the AI Hack for Freedom hackathon winners',
    reporter: null,
    url: 'https://hrf.org/latest/announcing-the-ai-hack-for-freedom-hackathon-winners/',
    // The official pages name only the team captain.
    subject: { kind: 'win', winId: 'stringer-safety', namesOwner: false },
  },
  {
    id: 'ai-hack-for-freedom-winners',
    outlet: 'AI Hack for Freedom',
    programme: null,
    date: null,
    title: 'Winners of all three editions',
    reporter: null,
    url: 'https://www.aihackforfreedom.org/winners.html',
    subject: { kind: 'reference' },
  },
]

export const press = parseContent(recordList(pressSchema), records, 'press')
