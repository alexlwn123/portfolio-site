import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { projectsCopy } from './copy'

/** A slot, waiting for its stickers. */
export const ProjectsSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="projects" surface="mat" title={projectsCopy.title} />
)
