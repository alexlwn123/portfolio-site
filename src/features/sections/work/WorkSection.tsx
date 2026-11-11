import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { workCopy } from './copy'

/** A slot, waiting for its stickers. */
export const WorkSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="work" surface="mat" title={workCopy.title} />
)
