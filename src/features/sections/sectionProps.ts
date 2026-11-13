import type { Content, Stats } from '../../content'

/** What every section of the home page is given: the whole record and its numbers. */
export interface SectionProps {
  readonly content: Content
  readonly stats: Stats
}
