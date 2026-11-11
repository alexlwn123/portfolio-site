import type { ReactElement } from 'react'

import {
  LANYARD_VIEW,
  STAR_DRAWN_ON,
  STRAP_LETTERING,
  STRAP_LINES,
  STRAP_STAR,
  type StrapLine,
} from '../stickers/geometry/lanyard'
import { STAR_PATH } from '../stickers/illustrations/Glyphs'
import { fragment, paintRef, svgId } from '../stickers/svgIds'
import styles from './Lanyard.module.css'
import { printStrap } from './strapPrint'

interface LanyardProps {
  /** The sticker the straps are placed under. Their SVG ids are built from it. */
  readonly id: string
  /** The words printed along each strap, with a star after each. */
  readonly left: readonly string[]
  readonly right: readonly string[]
}

interface StrapProps {
  /** The id of the line the strap is drawn and lettered along. */
  readonly line: string
  /** The id of the star that follows each word. */
  readonly star: string
  readonly shape: StrapLine
  readonly words: readonly string[]
}

const PERCENT = 100
const SHARE_DECIMALS = 3
const UNIT_DECIMALS = 2

function tidy(value: number, decimals: number): string {
  return String(Number(value.toFixed(decimals)))
}

/** A point a share of the way along a strap that hangs straight. */
function along({ from, to }: StrapLine, share: number): string {
  const x = from.x + (to.x - from.x) * share
  const y = from.y + (to.y - from.y) * share
  return `${tidy(x, UNIT_DECIMALS)} ${tidy(y, UNIT_DECIMALS)}`
}

/**
 * One strap: a line, drawn twice (the dark edge, then the face over it), with
 * its words set along it and a star after each. The page's script bends the
 * strap by redrawing the line: everything else follows it. The stars ride a
 * line of their own, one corner to a star, which the script redraws too.
 */
function Strap({ line, star, shape, words }: StrapProps): ReactElement {
  const length = Math.hypot(shape.to.x - shape.from.x, shape.to.y - shape.from.y)
  const print = printStrap(words, length)
  const marker = paintRef(star)

  return (
    <g data-strap={shape.fixed}>
      <defs>
        <path id={line} data-strap-line="" d={`M${along(shape, 0)}L${along(shape, 1)}`} />
      </defs>
      <use className={styles.edge} href={fragment(line)} />
      <use className={styles.face} href={fragment(line)} />
      {print.words.map(({ text, centre, length: set }, index) => (
        <text
          key={`${String(index)}-${text}`}
          className={styles.words}
          fontSize={STRAP_LETTERING.size}
          dy={STRAP_LETTERING.baseline}
        >
          <textPath
            href={fragment(line)}
            startOffset={`${tidy(centre * PERCENT, SHARE_DECIMALS)}%`}
            textLength={tidy(set, UNIT_DECIMALS)}
          >
            {text}
          </textPath>
        </text>
      ))}
      <path
        className={styles.stars}
        data-strap-stars={print.stars.map((share) => tidy(share, SHARE_DECIMALS + 2)).join(' ')}
        d={`M${print.stars.map((share) => along(shape, share)).join('L')}`}
        markerStart={marker}
        markerMid={marker}
        markerEnd={marker}
      />
    </g>
  )
}

/** The straps of the lanyard. Decoration: the wrapper that places them hides them from readers. */
export function Lanyard({ id, left, right }: LanyardProps): ReactElement {
  const star = svgId(id, 'star')
  const { width, height } = LANYARD_VIEW

  return (
    <svg
      className={styles.drawing}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      aria-hidden="true"
      focusable="false"
      data-lanyard=""
    >
      <defs>
        <marker id={star} markerUnits="userSpaceOnUse" orient="auto" overflow="visible">
          <path
            className={styles.star}
            d={STAR_PATH}
            transform={`scale(${tidy((STRAP_STAR.size * STRAP_LETTERING.size) / STAR_DRAWN_ON, SHARE_DECIMALS)})`}
          />
        </marker>
      </defs>
      <Strap line={svgId(id, 'left')} star={star} shape={STRAP_LINES.left} words={left} />
      <Strap line={svgId(id, 'right')} star={star} shape={STRAP_LINES.right} words={right} />
    </svg>
  )
}

export const strapsClass = styles.straps
