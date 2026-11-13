import type { ReactElement } from 'react'

import type { Experience } from '../../../content'
import { cx } from '../../../lib/classNames'
import { Barcode } from '../../stickers/Barcode'
import { Lines } from '../../stickers/Lines'
import metal from '../../stickers/metal.module.css'
import { toneClass } from '../../stickers/tones'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { workCopy } from './copy'
import { assetCode, startedLabel } from './describe'
import styles from './JobTag.module.css'
import type { PathJob } from './path'
import { stockFor } from './stock'

interface JobTagProps {
  readonly job: PathJob
  /** What the tag's barcode spells. */
  readonly barcode: string
}

/** The team, when the job began, and his own line about it: each only when the record has it. */
function TagBody({ role }: { readonly role: Experience }): ReactElement {
  const began = role.start === null ? null : startedLabel(role.start)

  return (
    <div className={styles.body}>
      {role.team !== null && (
        <p className={cx(voice.label, styles.team)} data-team="">
          {role.team}
        </p>
      )}
      {began !== null && (
        <p className={cx(voice.label, styles.when)}>
          {workCopy.tag.from} <time dateTime={began.iso}>{began.text}</time>
        </p>
      )}
      {role.description !== null && (
        <p className={cx(voice.marker, styles.words)} data-words="">
          {role.description}
        </p>
      )}
    </div>
  )
}

/** The barcode, and under it the number it spells. */
function TagAsset({
  assetNumber,
  barcode,
}: {
  readonly assetNumber: number
  readonly barcode: string
}): ReactElement {
  return (
    <div className={styles.asset}>
      <Barcode text={barcode} className={styles.bars} />
      <p className={cx(voice.label, styles.number)}>
        <span>{workCopy.tag.asset}</span> <span data-asset="">{assetCode(assetNumber)}</span>
      </p>
    </div>
  )
}

/** The inspection sticker on the tag that is still in service. */
function CurrentSeal(): ReactElement {
  return (
    <Stuck as="p" className={styles.seal}>
      <span className={styles.sealFace}>
        <span className={cx(voice.display, styles.sealWords)}>
          <Lines lines={workCopy.tag.current} />
        </span>
        <span className={cx(voice.label, styles.sealNote)}>{workCopy.tag.currentNote}</span>
      </span>
    </Stuck>
  )
}

/**
 * The asset tag a job left on the laptop: whose property he was, as what,
 * from when, and what he says about it. It prints a start and never an end,
 * because the record has no end date for any job.
 */
export function JobTag({ job: { role, assetNumber }, barcode }: JobTagProps): ReactElement {
  const headingId = `job-${role.id}`
  const stock = stockFor(assetNumber, role.current)

  return (
    <article
      className={styles.job}
      data-job={role.id}
      data-current={role.current ? '' : undefined}
      aria-labelledby={headingId}
    >
      <Stuck>
        <Vinyl as="div" className={cx(styles.tag, stock.metal && metal.brushed)}>
          <h3 id={headingId} className={styles.head}>
            <span className={cx(styles.owner, toneClass(stock.band))}>
              <span className={cx(voice.label, styles.ownerLabel)}>{workCopy.tag.owner}</span>{' '}
              <span className={cx(voice.label, styles.org)}>{role.organization}</span>
            </span>{' '}
            <span className={cx(voice.display, styles.title)}>{role.title}</span>
          </h3>
          <TagBody role={role} />
          <TagAsset assetNumber={assetNumber} barcode={barcode} />
        </Vinyl>
      </Stuck>
      {role.current && <CurrentSeal />}
    </article>
  )
}
