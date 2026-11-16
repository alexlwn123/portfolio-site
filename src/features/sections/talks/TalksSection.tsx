import type { FunctionComponent } from 'react'

import { MatRuler } from '../projects/mat/MatRuler'
import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { Clipping, SeeAlso } from './Clipping'
import { pressCuttings } from './clippings'
import { talksCopy } from './copy'
import { EditionCard } from './EditionCard'
import { OnAirSticker } from './OnAirSticker'
import styles from './TalksSection.module.css'
import { onAirShows } from './tour'
import { TourTee } from './TourTee'

/**
 * "Talks & press": the back of a tour shirt with every dated appearance on
 * it, and beside it the show that is still on air, the bitcoin++ record and
 * the press, cut out. Each of those is stuck in a place of its own, which the
 * stylesheet lays out. Static HTML and CSS.
 */
export const TalksSection: FunctionComponent<SectionProps> = ({ content, stats }) => {
  const { clippings, references } = pressCuttings(content)

  return (
    <SectionFrame id="talks" surface="mat" title={talksCopy.title} kicker={talksCopy.kicker}>
      <MatRuler edge="top" />
      <div className={styles.stage}>
        <TourTee name={content.profile.name} talks={content.talks} />
        <div className={styles.around}>
          {onAirShows(content.talks).map((show) => (
            <div key={show.id} className={styles.air}>
              <OnAirSticker show={show} />
            </div>
          ))}
          <div className={styles.card}>
            <EditionCard record={content.bitcoinPlusPlus} stats={stats.bitcoinPlusPlus} />
          </div>
          {clippings.map((clipping) => (
            <div key={clipping.id} className={styles.cutting}>
              <Clipping clipping={clipping} />
            </div>
          ))}
          {references.length > 0 && (
            <div className={styles.also}>
              <SeeAlso references={references} />
            </div>
          )}
        </div>
      </div>
    </SectionFrame>
  )
}
