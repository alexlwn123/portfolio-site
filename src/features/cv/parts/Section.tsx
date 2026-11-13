import type { ReactElement, ReactNode } from 'react'

import styles from '../cv.module.css'
import { type SectionId, sectionTitle } from '../labels'

interface SectionProps {
  readonly id: SectionId
  readonly children: ReactNode
}

/** A CV section: a landmark with a stable id, labelled by its heading. */
export function Section({ id, children }: SectionProps): ReactElement {
  const headingId = `${id}-heading`

  return (
    <section id={id} aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId} className={styles.sectionTitle}>
        {sectionTitle(id)}
      </h2>
      {children}
    </section>
  )
}
