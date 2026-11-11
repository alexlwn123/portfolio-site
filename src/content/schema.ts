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

export const dateSpanSchema = z.strictObject({
  start: partialDateSchema,
  end: partialDateSchema.nullable(),
})

export const linkSchema = z.strictObject({ label: text, url: httpsUrlSchema })

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
  graduated: partialDateSchema.nullable(),
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

export const winSchema = z.strictObject({
  id: slug,
  year,
  event: text,
  eventDate: dateSpanSchema.nullable(),
  eventPlace: text.nullable(),
  result: winResultSchema,
  project: text,
  description: text.nullable(),
  /** Stated facts that may be printed beside the win. */
  notes: z.array(text),
  /** A caution for whoever writes copy. Never printed. */
  caveat: text.nullable(),
  /** Set when he also ran the hackathon he won. */
  alsoOrganizedId: slug.nullable(),
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

/** Head counts and team counts are different units and are never added up. */
const participantsSchema = z.discriminatedUnion('unit', [
  z.strictObject({ unit: z.literal('people'), count }),
  z.strictObject({ unit: z.literal('teams'), count }),
])

const prizesSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('usd'), amount: count }),
  z.strictObject({ kind: z.literal('nonMonetary') }),
  z.strictObject({ kind: z.literal('bitcoin'), amountPublic: z.literal(false) }),
])

const organizedFields = {
  id: slug,
  name: text,
  location: locationSchema.nullable(),
  participants: participantsSchema.nullable(),
  prizes: prizesSchema.nullable(),
  note: text.nullable(),
  /** `inferredFromProfile`: his bitcoin++ profile shows him presenting the sessions. */
  basis: z.enum(['stated', 'inferredFromProfile']),
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
  detail: text.nullable(),
  alsoListedAs: text.nullable(),
  venue: z.strictObject({ name: text, confirmed: z.boolean() }).nullable(),
  links: z.array(linkSchema),
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
export type Profile = DeepReadonly<z.output<typeof profileSchema>>
export type Experience = DeepReadonly<z.output<typeof experienceSchema>>
export type Education = DeepReadonly<z.output<typeof educationSchema>>
export type WinResult = DeepReadonly<z.output<typeof winResultSchema>>
export type Win = DeepReadonly<z.output<typeof winSchema>>
export type Organized = DeepReadonly<z.output<typeof organizedSchema>>
export type HeldEvent = Extract<Organized, { status: 'held' }>
export type UpcomingEvent = Extract<Organized, { status: 'upcoming' }>
export type EventLocation = NonNullable<Organized['location']>
export type Talk = DeepReadonly<z.output<typeof talkSchema>>
export type BitcoinPlusPlus = DeepReadonly<z.output<typeof bitcoinPlusPlusSchema>>
export type Project = DeepReadonly<z.output<typeof projectSchema>>
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
  readonly press: readonly Press[]
}
