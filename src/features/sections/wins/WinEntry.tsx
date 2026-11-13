import { Fragment, type ReactElement, type ReactNode } from 'react'

import { cx } from '../../../lib/classNames'
import { formatDateSpan, isoDate } from '../../../lib/formatDate'
import { linkTo } from '../../../lib/linkTo'
import voice from '../../stickers/voice.module.css'
import { winsCopy } from './copy'
import { PrizeSticker } from './PrizeSticker'
import type { StickerLook } from './stickerLooks'
import styles from './WinEntry.module.css'
import type { WinFacts } from './winFacts'

interface WinEntryProps {
  readonly win: WinFacts
  readonly look: StickerLook
}

const SEPARATOR = ' · '

/** The result, the event, when and where, and the field: one line, joined by dots. */
function Result({ win }: { readonly win: WinFacts }): ReactElement {
  const { when, year } = win
  const date =
    when === null ? (
      <time dateTime={String(year)}>{year}</time>
    ) : (
      <time dateTime={isoDate(when.start)}>{formatDateSpan(when)}</time>
    )
  const parts: readonly ReactNode[] = [
    <strong key="result" className={styles.place}>
      {win.result}
    </strong>,
    win.event,
    date,
    win.place,
    win.field,
  ].filter((part) => part !== null)

  return (
    <p className={styles.result}>
      {parts.map((part, index) => (
        // The parts are a fixed, ordered list, so the index is a stable key.
        <Fragment key={index}>
          {index > 0 && SEPARATOR}
          {part}
        </Fragment>
      ))}
    </p>
  )
}

/** The record's links, then the press that names the win. Nothing when there are none. */
function Links({ win }: { readonly win: WinFacts }): ReactElement | null {
  const { links, press, title } = win
  if (links.length === 0 && press.length === 0) {
    return null
  }

  return (
    <>
      <ul className={styles.links} role="list">
        {links.map(({ label, href }) => (
          <li key={href}>
            <a
              className={styles.link}
              {...linkTo(href)}
              aria-label={winsCopy.linkName(label, title)}
            >
              {label}
            </a>
          </li>
        ))}
        {press.map(({ label, href, claim }) => (
          <li key={href}>
            <a
              className={styles.link}
              {...linkTo(href)}
              aria-label={winsCopy.linkName(label, claim)}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * One win on the sheet: its sticker, or the outline it left, and beside it
 * what the record says, printed where it can be read without touching
 * anything. It says what it was cut from, because the sheet gives a first
 * place more room than a second or a prize.
 */
export function WinEntry({ win, look }: WinEntryProps): ReactElement {
  return (
    <li className={styles.entry} data-win={win.id} data-shape={look.shape} data-finish={win.finish}>
      <div className={styles.slot}>
        <PrizeSticker win={win} look={look} />
      </div>
      <div className={styles.facts}>
        <h3 className={cx(voice.label, styles.title)}>{win.title}</h3>
        <Result win={win} />
        {win.description !== null && (
          <p className={styles.what} data-fact="description">
            {win.description}
          </p>
        )}
        {win.lines.map((line) => (
          <p key={line} className={styles.line}>
            {line}
          </p>
        ))}
        <Links win={win} />
      </div>
    </li>
  )
}
