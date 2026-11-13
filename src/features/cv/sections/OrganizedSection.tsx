import type { ReactElement, ReactNode } from 'react'

import type { Organized, Stats } from '../../../content'
import { heldEvents, upcomingEvents } from '../../../content/derive'
import styles from '../cv.module.css'
import {
  locationLabel,
  organizedSummary,
  participantsLabel,
  prizesLabel,
  projectsLabel,
} from '../describe'
import { LABELS } from '../labels'
import { DateSpanText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

const UPCOMING_HEADING_ID = 'organized-upcoming'

function eventWhen(event: Organized): ReactNode {
  if (event.date !== null) {
    return <DateSpanText span={event.date} />
  }
  return event.status === 'upcoming' ? LABELS.upcoming : null
}

function EventEntry({ event }: { readonly event: Organized }): ReactElement {
  const { location, participants, prizes, projects } = event

  return (
    <Entry when={eventWhen(event)}>
      <p className={styles.entryTitle}>{event.name}</p>
      <MetaLine
        parts={[location !== null ? locationLabel(location) : null, event.role, event.note]}
      />
      <MetaLine
        parts={[
          participants !== null ? participantsLabel(participants) : null,
          projects !== null ? projectsLabel(projects) : null,
          prizes !== null ? prizesLabel(prizes) : null,
        ]}
      />
    </Entry>
  )
}

/** Upcoming events sit under their own heading and are never counted. */
function Upcoming({ events }: { readonly events: readonly Organized[] }): ReactElement | null {
  if (events.length === 0) {
    return null
  }

  return (
    <>
      <h3 id={UPCOMING_HEADING_ID} className={styles.subheading}>
        {LABELS.upcoming}
      </h3>
      <p className={styles.note}>{LABELS.upcomingNote}</p>
      <ul aria-labelledby={UPCOMING_HEADING_ID} className={styles.entries}>
        {events.map((event) => (
          <EventEntry key={event.id} event={event} />
        ))}
      </ul>
    </>
  )
}

interface OrganizedSectionProps {
  readonly organized: readonly Organized[]
  readonly stats: Stats['organized']
}

export function OrganizedSection({ organized, stats }: OrganizedSectionProps): ReactElement {
  return (
    <Section id="organized">
      {organizedSummary(stats).map((sentence) => (
        <p key={sentence} className={styles.summary}>
          {sentence}
        </p>
      ))}
      <ul aria-label={LABELS.heldList} className={styles.entries}>
        {heldEvents(organized).map((event) => (
          <EventEntry key={event.id} event={event} />
        ))}
      </ul>
      <Upcoming events={upcomingEvents(organized)} />
    </Section>
  )
}
