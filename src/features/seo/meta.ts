import type { Content, Stats } from '../../content'
import { copy } from '../../content/copy'
import { formatNumber } from '../../lib/formatNumber'
import { PATHS } from '../../lib/paths'
import { buildPersonJsonLd, serializeJsonLd } from './jsonLd'

export type PageKey = 'home' | 'cv' | 'notFound'

export interface PageMeta {
  readonly title: string
  readonly description: string
  /** Null for pages that should not be indexed. */
  readonly canonical: string | null
  readonly robots: 'index, follow' | 'noindex'
  readonly siteName: string
  /** Absolute URL of the image used by link previews. */
  readonly image: string
  /** Serialized, script-safe JSON-LD, or null when the page carries none. */
  readonly jsonLd: string | null
}

const SOCIAL_IMAGE_PATH = '/android-chrome-512x512.png'
const CV_TITLE = 'CV'
const TITLE_SEPARATOR = ' · '

type MetaContent = Pick<Content, 'profile'>

function absoluteUrl(path: string, site: string): string {
  return new URL(path, site).href
}

function summary({ profile }: MetaContent, stats: Stats): string {
  const { role, location } = profile
  const wins = formatNumber(stats.wins.total)
  const organized = formatNumber(stats.organized.count)
  const countries = formatNumber(stats.organized.countryCount)

  return (
    `${role.title} at ${role.organization}, based in ${location.city}, ${location.region}. ` +
    `${wins} hackathon wins and ${organized} hackathons organized across ${countries} countries.`
  )
}

function cvSummary({ profile }: MetaContent, stats: Stats): string {
  const wins = formatNumber(stats.wins.total)
  const organized = formatNumber(stats.organized.count)

  return (
    `The plain CV of ${profile.name}: experience, ${wins} hackathon wins, ` +
    `${organized} hackathons organized, talks, projects and press.`
  )
}

/** Builds the head metadata for a page from the content, never from literals. */
export function buildMeta(page: PageKey, content: MetaContent, stats: Stats): PageMeta {
  const { profile } = content
  const image = absoluteUrl(SOCIAL_IMAGE_PATH, profile.site)
  const shared = { siteName: profile.name, image }

  if (page === 'notFound') {
    return {
      ...shared,
      title: [copy.notFound.title, profile.name].join(TITLE_SEPARATOR),
      description: copy.notFound.body,
      canonical: null,
      robots: 'noindex',
      jsonLd: null,
    }
  }

  const { role } = profile
  const indexable = {
    ...shared,
    canonical: absoluteUrl(PATHS[page], profile.site),
    robots: 'index, follow',
    jsonLd: serializeJsonLd(buildPersonJsonLd(content, image)),
  } as const

  return page === 'cv'
    ? {
        ...indexable,
        title: [CV_TITLE, profile.name].join(TITLE_SEPARATOR),
        description: cvSummary(content, stats),
      }
    : {
        ...indexable,
        title: [profile.name, `${role.title} at ${role.organization}`].join(TITLE_SEPARATOR),
        description: summary(content, stats),
      }
}
