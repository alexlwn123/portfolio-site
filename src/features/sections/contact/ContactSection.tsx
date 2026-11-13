import type { FunctionComponent } from 'react'

import { PATHS } from '../../../lib/paths'
import { AssetTag } from '../../stickers/AssetTag'
import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { Stuck } from '../Stuck'
import styles from './ContactSection.module.css'
import { contactCopy } from './copy'
import { LinkBands } from './LinkBands'
import { contactBands } from './links'
import { ReturnLabel } from './ReturnLabel'

/**
 * The end of the page: the address label with the work address, a strip of
 * wristband for each other way to reach him, the asset tag that leads to the
 * plain CV, and a line of small print to close on.
 */
export const ContactSection: FunctionComponent<SectionProps> = ({ content }) => (
  <SectionFrame id="contact" surface="mat" title={contactCopy.title} kicker={contactCopy.kicker}>
    <div className={styles.contact}>
      <div className={styles.label}>
        <ReturnLabel profile={content.profile} />
      </div>
      <div className={styles.bands}>
        <LinkBands bands={contactBands(content.profile.links)} />
      </div>
      <div className={styles.cv}>
        <Stuck href={PATHS.cv} className={styles.cvTag}>
          <AssetTag kicker={contactCopy.cv.kicker} label={contactCopy.cv.label} />
        </Stuck>
      </div>
    </div>
    <p className={styles.smallPrint}>{contactCopy.smallPrint}</p>
  </SectionFrame>
)
