import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { initials } from '../work/describe'
import { patentsCopy } from './copy'
import { InspectionStickers } from './InspectionStickers'
import styles from './PatentsSection.module.css'
import { RatingPlate } from './RatingPlate'

/**
 * The patents, on the plate under the machine: one riveted plate with a row
 * to a filing, and the two stickers stuck on it.
 */
export const PatentsSection: FunctionComponent<SectionProps> = ({ content, stats }) => (
  <SectionFrame id="patents" surface="lid" title={patentsCopy.title}>
    <div className={styles.underside}>
      <RatingPlate patents={content.patents} stats={stats.patents} holder={content.profile.name} />
      <InspectionStickers initials={initials(content.profile)} />
    </div>
  </SectionFrame>
)
