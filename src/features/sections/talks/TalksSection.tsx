import type { FunctionComponent } from 'react'

import { MatRuler } from '../projects/mat/MatRuler'
import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { BackstagePass } from './BackstagePass'
import { Clipping, SeeAlso } from './Clipping'
import { pressCuttings } from './clippings'
import { talksCopy } from './copy'
import { EditionCard } from './EditionCard'
import { OnAirSticker } from './OnAirSticker'
import styles from './TalksSection.module.css'
import { onAirShows, workshopPass } from './tour'
import { TourTee } from './TourTee'

/**
 * "Talks & press": the back of a tour shirt with every dated appearance on
 * it, and round it the show that is still on air, the workshop that has its
 * own backstage pass, the bitcoin++ record and the press, cut out. Static
 * HTML and CSS.
 */
export const TalksSection: FunctionComponent<SectionProps> = ({ content, stats }) => {
  const pass = workshopPass(content.talks)
  const { clippings, references } = pressCuttings(content)

  return (
    <SectionFrame id="talks" surface="mat" title={talksCopy.title} kicker={talksCopy.kicker}>
      <MatRuler edge="top" />
      <div className={styles.stage}>
        <TourTee name={content.profile.name} talks={content.talks} />
        <div className={styles.around}>
          {onAirShows(content.talks).map((show) => (
            <OnAirSticker key={show.id} show={show} />
          ))}
          {pass !== null && <BackstagePass pass={pass} />}
          <EditionCard record={content.bitcoinPlusPlus} stats={stats.bitcoinPlusPlus} />
          {clippings.map((clipping) => (
            <Clipping key={clipping.id} clipping={clipping} />
          ))}
          <SeeAlso references={references} />
        </div>
      </div>
    </SectionFrame>
  )
}
