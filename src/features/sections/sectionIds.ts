import { PATHS } from '../../lib/paths'

/*
 * The sections of the home page under the lid, in the order they come. Each
 * is built in a folder of its own beside this file, named by its id.
 */
export const SECTION_IDS = Object.freeze([
  'work',
  'wins',
  'projects',
  'organized',
  'talks',
  'patents',
  'contact',
] as const)

export type HomeSectionId = (typeof SECTION_IDS)[number]

/**
 * What a section is stuck to: the cobalt lid again, or the dark cutting mat.
 * Neighbouring sections take turns, so that each one starts with an edge.
 */
export type Surface = 'lid' | 'mat'

/** The id of a section's heading, which is what names the section. */
export function titleId(id: HomeSectionId): string {
  return `${id}-title`
}

/** A section's address, from any page of the site. */
export function sectionAnchor(id: HomeSectionId): string {
  return `${PATHS.home}#${id}`
}
