import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { organizedCopy } from './copy'

/** A slot, waiting for its stickers. */
export const OrganizedSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="organized" surface="lid" title={organizedCopy.title} />
)
