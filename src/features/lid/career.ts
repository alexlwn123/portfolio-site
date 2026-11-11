import type { Content, Stats } from '../../content'
import { copy } from '../../content/copy'
import { sectionAnchor } from '../sections/sectionIds'
import { countWord, currentJob, findById, introOpening } from './facts'
import type { GroupSpec, PropertyTagCut, PropertyTagSpec } from './stickerSpecs'
import type { StickerId } from './stickers'

/*
 * The part of the lid that is about the whole career and not about
 * hackathons: the introduction on the hello tag and the asset tags his
 * employers left behind. Like every sticker, they state nothing of their own:
 * the employer, the years and the patent count are read from the records.
 */

/**
 * An employer's asset tag: the job that puts it on the lid, and how the tag
 * is cut. They are listed as the record lists the jobs, newest first.
 */
const EMPLOYER_TAGS = [
  ['job-finite-computer', 'finite-computer', 'plate'],
  ['job-fedi', 'fedi', 'label'],
  ['job-zion', 'zion', 'strip'],
  ['job-blockspaces', 'blockspaces', 'label'],
  ['job-ncr', 'ncr', 'plate'],
] as const satisfies readonly (readonly [StickerId, string, PropertyTagCut])[]

/** The ids of the employers' tags, in the order they are read. */
export const EMPLOYER_IDS = EMPLOYER_TAGS.map(([id]) => id)

/** What sets one piece of an asset tag's small print apart from the next. */
const SMALL_PRINT_SEPARATOR = ' · '

/**
 * The hello tag's handwriting: who he is in his own first line, what he does
 * now, what came before and what happened along the way. The employer is the
 * job the record marks as current, and the patents are the granted ones.
 */
export function introduction({ profile, experience }: Content, stats: Stats): string {
  const { hello } = copy.lid
  const { granted } = stats.patents
  const patents = granted === 1 ? hello.patents.one : hello.patents.many

  return [
    introOpening(profile),
    hello.now(currentJob(experience).organization),
    hello.before,
    hello.alongTheWay(countWord(granted), patents),
  ].join(' ')
}

/** What goes under the name on an employer's tag: the year he started, and whether he is still there. */
function tagSmallPrint({ start, current }: Content['experience'][number]): string | null {
  const { issued, inService } = copy.lid.employers
  const lines = [...(start === null ? [] : [issued(start.year)]), ...(current ? [inService] : [])]

  return lines.length > 0 ? lines.join(SMALL_PRINT_SEPARATOR) : null
}

/** The asset tags his employers left on the lid, each a way into the career section. */
export function employers({ experience }: Content): GroupSpec<StickerId> {
  const words = copy.lid.employers

  return {
    kind: 'group',
    key: 'employers',
    label: words.label,
    stickers: EMPLOYER_TAGS.map(([id, jobId, cut]): PropertyTagSpec<StickerId> => {
      const job = findById(experience, jobId, 'job')
      return {
        id,
        kind: 'propertyTag',
        kicker: words.propertyOf,
        organization: job.organization,
        issued: tagSmallPrint(job),
        cut,
        href: sectionAnchor('work'),
      }
    }),
  }
}
