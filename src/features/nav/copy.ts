import type { HomeSectionId } from '../sections/sectionIds'

/**
 * Voice, not facts: what the strap pinned to the top of the home page says.
 * Every label is short, because eight of them share a phone's width.
 */
export const navCopy = Object.freeze({
  /** The landmark's name. The badge's ribbons are "Sections", so this is not. */
  label: 'On this page',
  top: 'Top',
  sections: Object.freeze({
    work: 'Work',
    wins: 'Wins',
    projects: 'Built',
    organized: 'Organized',
    talks: 'Talks',
    patents: 'Patents',
    contact: 'Contact',
  } satisfies Record<HomeSectionId, string>),
})
