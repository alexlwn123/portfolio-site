import { PATHS } from '../../lib/paths'

/** The lid's id, which is where "back to the top" leads. */
export const LID_ID = 'top'

/** The lid's address, from any page of the site. */
export function lidAnchor(): string {
  return `${PATHS.home}#${LID_ID}`
}

/** The pile's id: where the cover's cue to scroll leads. */
export const PILE_ID = 'pile'

/** The pile's address, from any page of the site. */
export function pileAnchor(): string {
  return `${PATHS.home}#${PILE_ID}`
}

/** The id of the pile's heading, which the pile is named by. */
export const PILE_TITLE_ID = `${PILE_ID}-title`
