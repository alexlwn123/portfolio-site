import type { FunctionComponent } from 'react'

import type { Content } from '../../../content'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { CareerPath } from './CareerPath'
import { workCopy } from './copy'
import { careerPath } from './path'
import { pathTotals } from './totals'

/** The line under the heading: how many jobs, from the first employer to the one he has now. */
export function workKicker({ experience }: Pick<Content, 'experience'>): string | undefined {
  const latest = experience.at(0)
  const first = experience.at(-1)
  return latest && first
    ? workCopy.kicker(experience.length, first.organization, latest.organization)
    : undefined
}

/**
 * The career in one path: the current job at the top, then every year back
 * to the first on record, with a tag for each job where it began and a small
 * sticker for what else happened that year.
 */
export const WorkSection: FunctionComponent<SectionProps> = ({ content, stats }) => (
  <SectionFrame id="work" surface="mat" title={workCopy.title} kicker={workKicker(content)}>
    <CareerPath
      stops={careerPath(content)}
      totals={pathTotals(content, stats)}
      profile={content.profile}
    />
  </SectionFrame>
)
