import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import { linkTo } from '../../lib/linkTo'
import { fragment, paintRef, svgId } from '../stickers/svgIds'
import { toneClass } from '../stickers/tones'
import voice from '../stickers/voice.module.css'
import styles from './PinButton.module.css'
import type { Pin } from './ribbons'

interface PinButtonProps {
  readonly pin: Pin
}

interface ButtonIds {
  readonly rim: string
  readonly dome: string
  readonly arc: string
}

function idsOf(pin: Pin): ButtonIds {
  const owner = svgId('pin', pin.id)
  return { rim: svgId(owner, 'rim'), dome: svgId(owner, 'dome'), arc: svgId(owner, 'arc') }
}

/**
 * What the button's drawing is filled with and lettered along: the roll of
 * its metal rim, the light on its dome, and the arc its lettering follows.
 * The arc runs past each end of the lettering, so a wider typeface still fits.
 */
function Definitions({ rim, dome, arc }: ButtonIds): ReactElement {
  return (
    <defs>
      <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" className={styles.metalLight} />
        <stop offset=".42" className={styles.metalMid} />
        <stop offset=".58" className={styles.metalLight} />
        <stop offset="1" className={styles.metalDark} />
      </linearGradient>
      <radialGradient id={dome} cx=".34" cy=".26" r=".82">
        <stop offset="0" className={styles.sheen} />
        <stop offset=".44" className={styles.sheenGone} />
        <stop offset=".7" className={styles.shadeGone} />
        <stop offset="1" className={styles.shade} />
      </radialGradient>
      <path id={arc} d="M26.2,63.8 A27.5,27.5 0 1,1 73.8,63.8" />
    </defs>
  )
}

/**
 * A pin-back button, the kind handed out at a conference: a printed disc
 * under clear film, domed, in a rolled metal rim. What it is goes around the
 * top and its count across the middle. It is a link. The link keeps its place
 * and the button inside it swings on its pin, so a pointer resting on its
 * edge stays on it.
 */
export function PinButton({ pin }: PinButtonProps): ReactElement {
  const ids = idsOf(pin)

  return (
    <a
      className={cx(styles.pin, toneClass(pin.tone))}
      data-pin=""
      aria-label={`${pin.label} ${pin.count}`}
      {...linkTo(pin.href)}
    >
      <svg
        className={styles.button}
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
        data-pin-button=""
      >
        <Definitions {...ids} />
        <circle data-part="rim" cx="50" cy="50" r="49" fill={paintRef(ids.rim)} />
        <circle data-part="face" className={styles.face} cx="50" cy="50" r="46" />
        <text data-part="label" className={cx(voice.label, styles.lettering)} fontSize="20">
          <textPath href={fragment(ids.arc)} startOffset="50%" textAnchor="middle">
            {pin.label}
          </textPath>
        </text>
        <text
          data-part="count"
          className={cx(voice.display, styles.lettering)}
          x="50"
          y="75"
          fontSize="27"
          textAnchor="middle"
        >
          {pin.count}
        </text>
        <circle data-part="gloss" cx="50" cy="50" r="46" fill={paintRef(ids.dome)} />
        <circle data-part="edge" className={styles.edge} cx="50" cy="50" r="45.4" />
        <path data-part="glint" className={styles.glint} d="M8.6,38.6 A43,43 0 0,1 29.6,12.2" />
      </svg>
    </a>
  )
}
