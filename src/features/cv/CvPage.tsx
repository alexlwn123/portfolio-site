import './print.css'

import type { ReactElement } from 'react'

import type { Content, Stats } from '../../content'
import { linkTo } from '../../lib/linkTo'
import { PATHS } from '../../lib/paths'
import styles from './cv.module.css'
import { CvHeader } from './CvHeader'
import { displayUrl } from './describe'
import { LABELS, MAIN_ID } from './labels'
import { ContactSection } from './sections/ContactSection'
import { EducationSection } from './sections/EducationSection'
import { ExperienceSection } from './sections/ExperienceSection'
import { OrganizedSection } from './sections/OrganizedSection'
import { PatentsSection } from './sections/PatentsSection'
import { PressSection } from './sections/PressSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { TalksSection } from './sections/TalksSection'
import { WinsSection } from './sections/WinsSection'

interface CvPageProps {
  readonly content: Content
  readonly stats: Stats
}

/** The complete record as a plain page. Renders to HTML only: no scripts. */
export function CvPage({ content, stats }: CvPageProps): ReactElement {
  const { profile } = content
  const address = new URL(PATHS.cv, profile.site).href

  return (
    <div className={styles.page}>
      <a className={styles.skip} href={`#${MAIN_ID}`} data-print="hide">
        {LABELS.skip}
      </a>
      <CvHeader profile={profile} />
      <main id={MAIN_ID}>
        <ExperienceSection experience={content.experience} />
        <WinsSection wins={content.wins} stats={stats.wins} />
        <OrganizedSection organized={content.organized} stats={stats.organized} />
        <TalksSection
          talks={content.talks}
          bitcoinPlusPlus={content.bitcoinPlusPlus}
          stats={stats.bitcoinPlusPlus}
        />
        <ProjectsSection projects={content.projects} wins={content.wins} />
        <PatentsSection patents={content.patents} stats={stats.patents} />
        <PressSection press={content.press} sources={content} />
        <EducationSection education={content.education} />
        <ContactSection profile={profile} />
      </main>
      <footer className={styles.footer}>
        <p data-print="hide">
          <a href={PATHS.home}>{LABELS.home}</a>
        </p>
        <p>
          {profile.name}
          {' · '}
          <a {...linkTo(address)}>{displayUrl(address)}</a>
        </p>
      </footer>
    </div>
  )
}
