import { deepFreeze } from '../lib/deepFreeze'

/**
 * Voice, not facts: slogans, labels and page furniture. Anything a reader
 * could check (names, dates, counts, links) lives in the record modules and
 * in derive.ts, never here.
 */
export const copy = deepFreeze({
  placeholder: {
    title: 'The lid is coming',
    body: 'This page will be the lid of a laptop, covered in stickers. Until they are stuck down, the plain CV has the whole record.',
    cvLink: 'Read the plain CV',
  },
  notFound: {
    title: 'Page not found',
    body: 'Nothing is stuck to this spot. The link may be old, or the address may have a typo.',
    homeLink: 'Back to the home page',
    cvLink: 'Read the plain CV',
  },
})
