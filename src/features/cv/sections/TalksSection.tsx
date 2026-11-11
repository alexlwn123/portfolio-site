import type { ReactElement, ReactNode } from 'react'

import type { BitcoinPlusPlus, Stats, Talk } from '../../../content'
import styles from '../cv.module.css'
import { bitcoinPlusPlusSummary } from '../describe'
import { LABELS, TALK_FORMATS, TALK_ROLES } from '../labels'
import { DateText } from '../parts/DateText'
import { Entry } from '../parts/Entry'
import { LinkList } from '../parts/LinkList'
import { MetaLine } from '../parts/MetaLine'
import { Section } from '../parts/Section'

function talkWhen(talk: Talk): ReactNode {
  if (talk.when === null) {
    return null
  }
  return talk.when.kind === 'ongoing' ? LABELS.ongoing : <DateText date={talk.when.date} />
}

function TalkEntry({ talk }: { readonly talk: Talk }): ReactElement {
  // An unconfirmed venue is treated like an unknown one: it is not printed.
  const venue = talk.venue?.confirmed === true ? talk.venue.name : null
  const format = talk.format !== null ? TALK_FORMATS[talk.format] : null
  const role = talk.role !== null ? TALK_ROLES[talk.role] : null

  return (
    <Entry when={talkWhen(talk)}>
      <p className={styles.entryTitle}>{talk.title}</p>
      <MetaLine parts={[format, role, venue, talk.detail]} />
      {talk.alsoListedAs !== null && (
        <p className={styles.note}>
          {LABELS.alsoListedAs} “{talk.alsoListedAs}”
        </p>
      )}
      <LinkList links={talk.links} context={talk.title} />
    </Entry>
  )
}

interface RecordProps {
  readonly record: BitcoinPlusPlus
  readonly stats: Stats['bitcoinPlusPlus']
}

function BitcoinPlusPlusRecord({ record, stats }: RecordProps): ReactElement {
  return (
    <>
      <h3 className={styles.subheading}>{LABELS.bitcoinPlusPlus}</h3>
      <p className={styles.summary}>{bitcoinPlusPlusSummary(stats)}</p>
      <ul aria-label={LABELS.editionsList} className={styles.inlineList}>
        {record.editions.map((edition) => (
          <li key={`${edition.city}-${String(edition.year)}`}>
            {edition.city} {edition.year}
          </li>
        ))}
      </ul>
    </>
  )
}

interface TalksSectionProps {
  readonly talks: readonly Talk[]
  readonly bitcoinPlusPlus: BitcoinPlusPlus
  readonly stats: Stats['bitcoinPlusPlus']
}

export function TalksSection({ talks, bitcoinPlusPlus, stats }: TalksSectionProps): ReactElement {
  return (
    <Section id="talks">
      <ul aria-label={LABELS.talksList} className={styles.entries}>
        {talks.map((talk) => (
          <TalkEntry key={talk.id} talk={talk} />
        ))}
      </ul>
      <BitcoinPlusPlusRecord record={bitcoinPlusPlus} stats={stats} />
    </Section>
  )
}
