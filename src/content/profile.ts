import type { z } from 'zod'

import { parseContent } from './parse'
import { profileSchema } from './schema'

const record: z.input<typeof profileSchema> = {
  name: 'Alex Lewin',
  givenName: 'Alex',
  familyName: 'Lewin',
  location: { city: 'Atlanta', region: 'Georgia', regionCode: 'GA', country: 'USA' },
  // The real title, as printed on his business card.
  role: { title: 'Minister of Development', organization: 'Finite Computer' },
  field:
    'Software engineering. Bitcoin and Lightning Network development from 2022, AI agents now.',
  selfDescription: [
    'A software engineer from Atlanta, GA.',
    'I organize and compete in hackathons around the world.',
    'I’m passionate about Bitcoin & freedom tech.',
    'I study & build projects with Bitcoin. I discover & tinker with new tech. I travel and organize hackathons.',
  ],
  site: 'https://alex.lwn.lol',
  // The work address from the CV file's Links table. Never a personal mailbox.
  email: 'alex@finite.computer',
  links: [
    { id: 'github', label: 'GitHub', shortLabel: null, url: 'https://github.com/alexlwn123' },
    { id: 'x', label: 'X', shortLabel: null, url: 'https://x.com/ALewin' },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      shortLabel: null,
      url: 'https://www.linkedin.com/in/alex-lewin-058265174/',
    },
    { id: 'devpost', label: 'Devpost', shortLabel: null, url: 'https://devpost.com/alexlwn123' },
    {
      id: 'bitcoinPlusPlus',
      label: 'bitcoin++ community profile',
      shortLabel: null,
      url: 'https://btcpp.dev/whois/alexlwn123',
    },
    {
      id: 'booking',
      label: 'Book a 30-minute call',
      shortLabel: 'Book 30 min',
      url: 'https://fantastical.app/alexlwn123/30mins',
    },
    {
      id: 'card',
      label: 'Business-card page',
      shortLabel: null,
      url: 'https://qr.lwn.lol',
    },
  ],
}

export const profile = parseContent(profileSchema, record, 'profile')
