import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { contactCopy } from './copy'

/** A slot, waiting for its stickers. */
export const ContactSection: FunctionComponent<SectionProps> = () => (
  <SectionFrame id="contact" surface="mat" title={contactCopy.title} />
)
