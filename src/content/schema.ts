import { z } from 'zod'

import type { DeepReadonly } from '../lib/deepFreeze'

/*
 * One schema per record type. Objects are strict, so a misspelt or invented
 * field fails the build, and every value the CV file leaves unknown is an
 * explicit null instead of a missing key.
 */

// ---------- shared pieces ----------

const text = z.string().trim().min(1)
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase-with-dashes id')
const year = z.int().min(2000).max(2100)
const count = z.int().positive()

export const httpsUrlSchema = z.url({
  protocol: /^https$/,
  error: 'Expected an https:// URL',
})

/** Consumer mailbox providers. The site publishes a work address only. */
export const PERSONAL_MAIL_DOMAINS = Object.freeze([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
] as const)

function isWorkAddress(address: string): boolean {
  const domain = address.split('@').at(-1)?.toLowerCase() ?? ''
  return !PERSONAL_MAIL_DOMAINS.some((personal) => personal === domain)
}

export const workEmailSchema = z
  .email()
  .refine(isWorkAddress, { error: 'Expected a work address, not a personal mailbox' })

/** A date known to the year, the month or the day. */
export const partialDateSchema = z
  .strictObject({
    year,
    month: z.int().min(1).max(12).nullable(),
    day: z.int().min(1).max(31).nullable(),
  })
  .refine((date) => date.day === null || date.month !== null, {
    path: ['day'],
    error: 'A day needs a month',
  })

/** A date known to the day, as a patent office records one. */
export const exactDateSchema = z.strictObject({
  year,
  month: z.int().min(1).max(12),
  day: z.int().min(1).max(31),
})

export const dateSpanSchema = z.strictObject({
  start: partialDateSchema,
  end: partialDateSchema.nullable(),
})

export const linkSchema = z.strictObject({ label: text, url: httpsUrlSchema })

/**
 * Where a record's facts come from, for whoever reviews the data. Never
 * printed. `owner`: he stated it, and `urls` are public pages that back it up
 * when there are any. `publicRecord`: web research added or corrected it and
 * he has not confirmed it yet; `note` says what the research changed.
 */
export const sourceSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('owner'), urls: z.array(httpsUrlSchema) }),
  z.strictObject({
    kind: z.literal('publicRecord'),
    urls: z.array(httpsUrlSchema),
    note: text,
  }),
])

// ---------- profile ----------

export const profileSchema = z.strictObject({
  name: text,
  givenName: text,
  familyName: text,
  location: z.strictObject({ city: text, region: text, regionCode: text, country: text }),
  role: z.strictObject({ title: text, organization: text }),
  field: text,
  /** His own words, from his current site and GitHub profile. */
  selfDescription: z.array(text).min(1),
  site: httpsUrlSchema,
  email: workEmailSchema,
  links: z.array(
    z.strictObject({
      id: z.enum(['card', 'github', 'x', 'linkedin', 'booking', 'devpost', 'bitcoinPlusPlus']),
      label: text,
      shortLabel: text.nullable(),
      url: httpsUrlSchema,
      source: sourceSchema,
    }),
  ),
})

// ---------- experience and education ----------

export const experienceSchema = z.strictObject({
  id: slug,
  organization: text,
  title: text,
  team: text.nullable(),
  start: partialDateSchema.nullable(),
  end: partialDateSchema.nullable(),
  current: z.boolean(),
  description: text.nullable(),
})

export const educationSchema = z.strictObject({
  id: slug,
  institution: text,
  level: text,
  subject: text,
  start: partialDateSchema.nullable(),
  /** The last year he was enrolled. Not a graduation: that is its own field. */
  end: partialDateSchema.nullable(),
  graduated: partialDateSchema.nullable(),
  source: sourceSchema,
})

// ---------- hackathon wins ----------

/**
 * A podium place and a prize are different kinds of result. A prize has no
 * `place` field at all, so nothing can render it as 1st, 2nd or 3rd.
 */
export const winResultSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('place'),
    place: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    qualifier: z.enum(['overall', 'tied']).nullable(),
  }),
  z.strictObject({ kind: z.literal('prize'), prizeName: text.nullable() }),
])

/** Where an event was held. The city is a field of its own, so nothing reads it out of prose. */
const winPlaceSchema = z.strictObject({
  venue: text.nullable(),
  city: text,
  region: text.nullable(),
})

/** How many entries a win was chosen from. `atLeast` is the plus in "300+". */
const fieldSchema = z.strictObject({
  unit: z.literal('teams'),
  count,
  atLeast: z.boolean(),
})

/** The team a project was entered by. `teammates` are the others a source names. */
const teamSchema = z.strictObject({ name: text, teammates: z.array(text) })

/** An amount in sats. `atLeast` is true when the record says "more than". */
const satsFigureSchema = z.strictObject({ sats: count, atLeast: z.boolean() })

export const winSchema = z
  .strictObject({
    id: slug,
    year,
    event: text,
    /** Which running of the event, when its organizers number them: "3rd annual". */
    edition: text.nullable(),
    eventDate: dateSpanSchema.nullable(),
    eventPlace: winPlaceSchema.nullable(),
    result: winResultSchema,
    field: fieldSchema.nullable(),
    /** Null when the project's name is not known. The team is named instead. */
    project: text.nullable(),
    /** Another name the organizers announced the project under. */
    announcedAs: text.nullable(),
    team: teamSchema.nullable(),
    description: text.nullable(),
    /** What the project collected and paid out in its first week, when that is stated. */
    firstWeekSats: satsFigureSchema.nullable(),
    /** Stated facts that may be printed beside the win. */
    notes: z.array(text),
    links: z.array(linkSchema),
    /** A caution for whoever writes copy. Never printed. */
    caveat: text.nullable(),
    /** Set when he also ran the hackathon he won. */
    alsoOrganizedId: slug.nullable(),
    source: sourceSchema,
  })
  .refine((win) => win.project !== null || win.team !== null, {
    path: ['project'],
    error: 'A win needs a project or a team to be named by',
  })

// ---------- hackathons organized ----------

const locationSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('inPerson'),
    city: text,
    region: text.nullable(),
    country: text,
  }),
  z.strictObject({ kind: z.literal('online'), context: text.nullable() }),
])

/**
 * An exact head count, an approximate one and a count of teams are different
 * kinds of figure. Only exact head counts are ever added up.
 */
const participantsSchema = z.discriminatedUnion('unit', [
  z.strictObject({ unit: z.literal('people'), count }),
  z.strictObject({ unit: z.literal('aboutPeople'), count }),
  z.strictObject({ unit: z.literal('teams'), count }),
])

/** A prize in dollars and a prize in sats are different kinds. Only dollars are added up. */
const prizesSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('usd'), amount: count }),
  z.strictObject({ kind: z.literal('sats'), amount: count }),
  z.strictObject({ kind: z.literal('nonMonetary') }),
])

const organizedFields = {
  id: slug,
  name: text,
  location: locationSchema.nullable(),
  participants: participantsSchema.nullable(),
  prizes: prizesSchema.nullable(),
  /** Projects submitted, when the organizers published the number. */
  projects: count.nullable(),
  /** His title on the organizing team, when a source gives one. */
  role: text.nullable(),
  note: text.nullable(),
  /** `inferredFromProfile`: his bitcoin++ profile shows him presenting the sessions. */
  basis: z.enum(['stated', 'inferredFromProfile']),
  source: sourceSchema,
}

/** An upcoming event is in the data and flagged, and is never counted. */
export const organizedSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('held'), date: dateSpanSchema, ...organizedFields }),
  z.strictObject({
    status: z.literal('upcoming'),
    date: dateSpanSchema.nullable(),
    ...organizedFields,
  }),
])

// ---------- talks ----------

export const talkSchema = z.strictObject({
  id: slug,
  when: z
    .discriminatedUnion('kind', [
      z.strictObject({ kind: z.literal('date'), date: partialDateSchema }),
      z.strictObject({ kind: z.literal('ongoing') }),
    ])
    .nullable(),
  title: text,
  format: z.enum(['discussion', 'workshop', 'panel', 'talk', 'podcast']).nullable(),
  /** The part he played, when it was not simply giving the talk. */
  role: z.enum(['moderator', 'panelist', 'guest', 'coHost']).nullable(),
  detail: text.nullable(),
  alsoListedAs: text.nullable(),
  /** Where it was given. For a podcast, the show and the episode. */
  venue: z.strictObject({ name: text, confirmed: z.boolean() }).nullable(),
  links: z.array(linkSchema),
  source: sourceSchema,
})

export const bitcoinPlusPlusSchema = z
  .strictObject({
    profileUrl: httpsUrlSchema,
    memberSince: year,
    editionsAttended: count,
    stageSessions: count,
    editions: z.array(z.strictObject({ city: text, year })),
  })
  .refine((record) => record.editions.length === record.editionsAttended, {
    path: ['editions'],
    error: 'The edition list must have exactly editionsAttended entries',
  })

// ---------- projects ----------

export const projectSchema = z.strictObject({
  id: slug,
  name: text,
  /** Null when the file says "See wins": the win record holds the description. */
  description: text.nullable(),
  winId: slug.nullable(),
  note: text.nullable(),
  /** A claim the file reports but does not verify. Never printed. */
  unverifiedClaim: text.nullable(),
  /** False when the file says to confirm with him before featuring it. */
  confirmed: z.boolean(),
  links: z.array(linkSchema).min(1),
})

// ---------- patents ----------

/** "12,536,579" for a patent, "2023/0032782" for a published application. */
const PATENT_SERIAL = /^\d{1,3}(?:,\d{3})+$/
const APPLICATION_SERIAL = /^\d{4}\/\d{7}$/

const patentNumberSchema = z.strictObject({
  office: z.literal('US'),
  /** The number as the patent office prints it, without the office or the kind code. */
  serial: z.union([z.string().regex(PATENT_SERIAL), z.string().regex(APPLICATION_SERIAL)], {
    error: 'Expected a number as printed: "12,536,579" or "2023/0032782"',
  }),
  kindCode: z.string().regex(/^[AB]\d$/, 'Expected a kind code such as "B2" or "A1"'),
})

/** A granted patent has a grant date. An application has none to give. */
const patentStatusSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('granted'), granted: exactDateSchema }),
  z.strictObject({ kind: z.literal('pending') }),
  z.strictObject({ kind: z.literal('abandoned') }),
])

/**
 * A patent filing he is a named inventor on. An application is not a patent:
 * the status says which a record is, and its number has to agree.
 */
export const patentSchema = z
  .strictObject({
    id: slug,
    number: patentNumberSchema,
    title: text,
    filed: exactDateSchema.nullable(),
    status: patentStatusSchema,
    assignee: text,
    /** The other named inventors. */
    coInventors: z.array(text),
    /** Its public record. */
    link: linkSchema,
    /** False keeps a filing in the data and off the site. His to flip. */
    shown: z.boolean(),
  })
  .refine(
    ({ number, status }) =>
      status.kind === 'granted'
        ? PATENT_SERIAL.test(number.serial) && number.kindCode.startsWith('B')
        : APPLICATION_SERIAL.test(number.serial) && number.kindCode.startsWith('A'),
    {
      path: ['number'],
      error: 'A granted patent takes a patent number (B), an application an application number (A)',
    },
  )

// ---------- press ----------

/**
 * What a piece is about is structured, and there is no free-text claim. The
 * sentence a page prints is derived from these fields (see pressClaim.ts), so
 * copy cannot say more than the record does.
 */
const pressSubjectSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('organizedEvent'),
    organizedId: slug,
    namesEvent: z.boolean(),
    namesOwner: z.boolean(),
  }),
  z.strictObject({ kind: z.literal('win'), winId: slug, namesOwner: z.boolean() }),
  /** A plain reference page. `label` says what it lists and claims nothing about him. */
  z.strictObject({ kind: z.literal('reference'), label: text }),
])

export const pressSchema = z.strictObject({
  id: slug,
  outlet: text,
  programme: text.nullable(),
  date: partialDateSchema.nullable(),
  /** The headline as published. Null when the file does not record one. */
  title: text.nullable(),
  reporter: text.nullable(),
  url: httpsUrlSchema,
  subject: pressSubjectSchema,
})

// ---------- types ----------

export type PartialDate = DeepReadonly<z.output<typeof partialDateSchema>>
export type DateSpan = DeepReadonly<z.output<typeof dateSpanSchema>>
export type Link = DeepReadonly<z.output<typeof linkSchema>>
export type Source = DeepReadonly<z.output<typeof sourceSchema>>
export type Profile = DeepReadonly<z.output<typeof profileSchema>>
export type Experience = DeepReadonly<z.output<typeof experienceSchema>>
export type Education = DeepReadonly<z.output<typeof educationSchema>>
export type WinResult = DeepReadonly<z.output<typeof winResultSchema>>
export type Win = DeepReadonly<z.output<typeof winSchema>>
export type WinPlace = NonNullable<Win['eventPlace']>
export type WinField = NonNullable<Win['field']>
export type SatsFigure = NonNullable<Win['firstWeekSats']>
export type Organized = DeepReadonly<z.output<typeof organizedSchema>>
export type HeldEvent = Extract<Organized, { status: 'held' }>
export type UpcomingEvent = Extract<Organized, { status: 'upcoming' }>
export type EventLocation = NonNullable<Organized['location']>
export type Talk = DeepReadonly<z.output<typeof talkSchema>>
export type BitcoinPlusPlus = DeepReadonly<z.output<typeof bitcoinPlusPlusSchema>>
export type Project = DeepReadonly<z.output<typeof projectSchema>>
export type Patent = DeepReadonly<z.output<typeof patentSchema>>
export type PatentNumber = Patent['number']
export type Press = DeepReadonly<z.output<typeof pressSchema>>

/** Everything the site knows, as one read-only value. */
export interface Content {
  readonly profile: Profile
  readonly experience: readonly Experience[]
  readonly education: readonly Education[]
  readonly wins: readonly Win[]
  readonly organized: readonly Organized[]
  readonly talks: readonly Talk[]
  readonly bitcoinPlusPlus: BitcoinPlusPlus
  readonly projects: readonly Project[]
  readonly patents: readonly Patent[]
  readonly press: readonly Press[]
}
