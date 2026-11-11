import type { FunctionComponent, ReactElement } from 'react'

import { SectionFrame } from '../SectionFrame'
import type { SectionProps } from '../sectionProps'
import { winsCopy } from './copy'
import { SheetHeader } from './SheetHeader'
import { stickerLook } from './stickerLooks'
import { WinEntry } from './WinEntry'
import { winFacts, winsSpan, winsTally } from './winFacts'
import styles from './WinsSection.module.css'

/** What a printer leaves on a sheet: crop marks in the corners and a colour bar. */
function PrintersMarks(): ReactElement {
  return (
    <div className={styles.marks} aria-hidden="true">
      <span className={styles.crop} />
      <span className={styles.crop} />
      <span className={styles.crop} />
      <span className={styles.crop} />
      <span className={styles.bar} />
      <span className={styles.tape} />
      <span className={styles.tape} />
    </div>
  )
}

/**
 * Hackathon wins: a sheet of kiss-cut prize stickers lying on the lid, as the
 * sticker shop sent it. Every win is a sticker still on the sheet, with its
 * facts printed beside it, except the newest, which has been peeled off and
 * stuck on the lid above.
 */
export const WinsSection: FunctionComponent<SectionProps> = ({ content, stats }) => {
  const wins = winFacts(content)

  return (
    <SectionFrame id="wins" surface="lid" title={winsCopy.title}>
      <div className={styles.sheet}>
        <div className={styles.paper} aria-hidden="true" />
        <PrintersMarks />
        <SheetHeader
          total={stats.wins.total}
          tally={winsTally(stats.wins)}
          span={winsSpan(content.wins)}
        />
        <ol className={styles.wins} role="list" aria-label={winsCopy.sheet.listLabel}>
          {wins.map((win, index) => (
            <WinEntry key={win.id} win={win} look={stickerLook(win, index)} />
          ))}
        </ol>
      </div>
    </SectionFrame>
  )
}
