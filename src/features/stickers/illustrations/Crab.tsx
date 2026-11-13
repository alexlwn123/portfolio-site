import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import paint from '../paint.module.css'
import { paintRef, svgId } from '../svgIds'
import voice from '../voice.module.css'
import styles from './Crab.module.css'

interface CrabProps {
  /** The sticker this drawing belongs to. Its filter id is built from it. */
  readonly id: string
  /** The words on the strip under the crab. */
  readonly caption: string
}

/** Grows the drawing's outline into a white die-cut border. */
function DieCut({ id }: { readonly id: string }): ReactElement {
  return (
    <filter id={id} x="-15%" y="-15%" width="130%" height="130%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="7" />
      <feGaussianBlur stdDeviation="2.2" />
      <feComponentTransfer result="grow">
        <feFuncA type="linear" slope="12" intercept="-5" />
      </feComponentTransfer>
      <feFlood className={styles.edge} />
      <feComposite in2="grow" operator="in" result="border" />
      <feMerge>
        <feMergeNode in="border" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  )
}

function Claw({ arm, pincer }: { readonly arm: string; readonly pincer: string }): ReactElement {
  return (
    <>
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d={arm}
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        className={cx(paint.hollow, paint.tangLine)}
        d={arm}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        className={cx(paint.gum, paint.inkLine)}
        d={pincer}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </>
  )
}

function Eye({ cx: x, pupil }: { readonly cx: string; readonly pupil: string }): ReactElement {
  return (
    <>
      <circle className={cx(paint.white, paint.inkLine)} cx={x} cy="27" r="10" strokeWidth="4.5" />
      <circle className={paint.ink} cx={pupil} cy="27" r="4" />
    </>
  )
}

function Body(): ReactElement {
  return (
    <>
      <ellipse
        className={cx(paint.tang, paint.inkLine)}
        cx="100"
        cy="88"
        rx="52"
        ry="36"
        strokeWidth="5"
      />
      <path
        className={cx(paint.hollow, styles.shell)}
        d="M64 76Q100 52 136 76"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Eye cx="80" pupil="83" />
      <Eye cx="120" pupil="123" />
      <path
        className={cx(paint.hollow, paint.inkLine)}
        d="M89 97Q100 107 111 97"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle className={paint.gum} cx="72" cy="94" r="6" />
      <circle className={paint.gum} cx="128" cy="94" r="6" />
    </>
  )
}

export function Crab({ id, caption }: CrabProps): ReactElement {
  const dieCut = svgId(id, 'die-cut')

  return (
    <svg className={paint.art} viewBox="-6 -4 212 178" aria-hidden="true" focusable="false">
      <defs>
        <DieCut id={dieCut} />
      </defs>
      <g filter={paintRef(dieCut)}>
        <g
          className={cx(paint.hollow, paint.inkLine)}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M56 100L34 106L26 122M60 110L42 122L38 136M70 118L58 132L58 144" />
          <path d="M144 100L166 106L174 122M140 110L158 122L162 136M130 118L142 132L142 144" />
          <path d="M84 56L80 32M116 56L120 32" />
        </g>
        <Claw arm="M54 76Q30 68 30 46" pincer="M28 34L36.6 12.6A19 19 0 1 1 19.4 12.6Z" />
        <Claw arm="M146 76Q170 68 170 46" pincer="M172 34L180.6 12.6A19 19 0 1 1 163.4 12.6Z" />
        <Body />
        <rect className={paint.ink} x="22" y="136" width="156" height="30" rx="15" />
        <text
          className={cx(voice.label, styles.caption)}
          x="100"
          y="156.5"
          fontSize="14.5"
          textAnchor="middle"
        >
          {caption}
        </text>
      </g>
    </svg>
  )
}
