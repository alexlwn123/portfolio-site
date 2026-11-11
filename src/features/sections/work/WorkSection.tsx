import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { CareerPath } from './CareerPath'
import { workCopy } from './copy'
import { careerPath } from './path'
import { pathTotals } from './totals'

/**
 * The career in one path: the current job at the top, then every year back
 * to the first on record, with a tag for each job where it began and a small
 * sticker for what else happened that year.
 */
export const WorkSection: FunctionComponent<SectionProps> = ({ content, stats }) => (
  <SectionFrame id="work" surface="mat" title={workCopy.title} kicker={workCopy.kicker}>
    <CareerPath
      stops={careerPath(content)}
      totals={pathTotals(content, stats)}
      profile={content.profile}
    />
  </SectionFrame>
)
