import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { winsCopy } from './copy'

/** A slot, waiting for its stickers. */
export const WinsSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="wins" surface="lid" title={winsCopy.title} />
)
