import type { FunctionComponent } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { organizedCopy } from './copy'
import { eventLabels } from './eventLabels'
import { Hand } from './Hand'
import styles from './OrganizedSection.module.css'
import { Totals } from './Totals'
import { organizedTotals } from './organizedTotals'
import { Wristbands } from './Wristbands'

/**
 * Hackathons organized: an arm reaching up the lid with one festival
 * wristband per hackathon, newest at the wrist. A port of the approved
 * design/mockups/02-wristbands.html, with every figure read from the record.
 */
export const OrganizedSection: FunctionComponent<SectionProps> = ({ content, stats }) => {
  const totals = organizedTotals(stats.organized)

  return (
    <SectionFrame id="organized" surface="lid" title={organizedCopy.title}>
      <div className={styles.scene}>
        <div className={styles.top}>
          <Totals totals={totals} />
          <div className={styles.hand}>
            <Hand stamp={totals.stamp} />
          </div>
        </div>
        <Wristbands events={content.organized} labels={eventLabels(content)} />
      </div>
    </SectionFrame>
  )
}
