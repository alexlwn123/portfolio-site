import { PATHS } from '../../lib/paths'

/** The lid's id, which is where "back to the top" leads. */
export const LID_ID = 'top'

/** The lid's address, from any page of the site. */
export function lidAnchor(): string {
  return `${PATHS.home}#${LID_ID}`
}
