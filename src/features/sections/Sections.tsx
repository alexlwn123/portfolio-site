import type { ReactElement } from 'react'

import { ContactSection } from './contact/ContactSection'
import { OrganizedSection } from './organized/OrganizedSection'
import { PatentsSection } from './patents/PatentsSection'
import { ProjectsSection } from './projects/ProjectsSection'
import type { SectionProps } from './sectionProps'
import { TalksSection } from './talks/TalksSection'
import { WinsSection } from './wins/WinsSection'
import { WorkSection } from './work/WorkSection'

/**
 * Everything under the lid: the career in full, a section to a subject, in
 * the order of SECTION_IDS. Each section is its own folder beside this file.
 */
export function Sections(props: SectionProps): ReactElement {
  return (
    <>
      <WorkSection {...props} />
      <WinsSection {...props} />
      <ProjectsSection {...props} />
      <OrganizedSection {...props} />
      <TalksSection {...props} />
      <PatentsSection {...props} />
      <ContactSection {...props} />
    </>
  )
}
