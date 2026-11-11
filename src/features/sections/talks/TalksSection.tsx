import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { talksCopy } from './copy'

/** A slot, waiting for its stickers. */
export const TalksSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="talks" surface="mat" title={talksCopy.title} />
)
