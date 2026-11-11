import { deepFreeze } from '../lib/deepFreeze'
import { deriveStats } from './derive'
import { education, experience } from './experience'
import { organized } from './organized'
import { patents } from './patents'
import { press } from './press'
import { profile } from './profile'
import { projects } from './projects'
import { assertReferences } from './references'
import type { Content } from './schema'
import { bitcoinPlusPlus, talks } from './talks'
import { wins } from './wins'

/**
 * The whole record, validated as each module loads and frozen. This module is
 * imported at build time only: nothing hydrates, so neither the records nor
 * zod reach a browser.
 */
export const content: Content = deepFreeze({
  profile,
  experience,
  education,
  wins,
  organized,
  talks,
  bitcoinPlusPlus,
  projects,
  patents,
  press,
})

assertReferences(content)

/** Every number the site prints. */
export const stats = deepFreeze(deriveStats(content))

export { copy } from './copy'
export type { Stats } from './derive'
export type * from './schema'
