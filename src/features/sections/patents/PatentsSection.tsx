import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { patentsCopy } from './copy'

/** A slot, waiting for its stickers. */
export const PatentsSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="patents" surface="lid" title={patentsCopy.title} />
)
