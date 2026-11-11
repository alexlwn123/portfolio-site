import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import styles from './DieCutText.module.css'
import { FOIL_REST, foilGlowCentre, NAME_GLOW_FIELD } from './geometry/foil'
import {
  NAME_LAST_TURN,
  NAME_LIGHT,
  NAME_LINES,
  NAME_MEASURE,
  NAME_VIEW,
  setLine,
} from './geometry/nameFace'
import paint from './paint.module.css'
import { fragment, paintRef, SHARED_IDS, svgId } from './svgIds'

interface DieCutTextProps {
  /** The sticker this drawing belongs to. Its ids are built from it. */
  readonly id: string
  /** Two lines, each set across the full width. */
  readonly lines: readonly [string, string]
  /**
   * What the lettering says, when it is the only place that says it. With a
   * label the drawing is an image by that name. Without one it is decoration.
   */
  readonly label?: string | undefined
}

interface DefinitionIds {
  readonly stripes: string
  readonly glow: string
  readonly shine: string
  readonly outline: string
}

/** One letter of the name: a piece of its own, so it can be stuck down by itself. */
interface Piece {
  readonly id: string
  readonly letter: string
  readonly x: number
  readonly size: number
  readonly baseline: number
  /** True for the last letter of a line: a space is printed after it, never drawn. */
  readonly endsLine: boolean
}

/** Three twinkles, at fixed spots among the letters. */
const SPARKS = [
  'M118 34l5 13 13 5-13 5-5 13-5-13-13-5 13-5z',
  'M404 176l4 10 10 4-10 4-4 10-4-10-10-4 10-4z',
  'M300 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z',
] as const

/** The six copies every letter is stacked from, back to front, and what each is cut or filled with. */
const LAYERS = [
  { name: 'cut', className: styles.cut, transform: 'translate(3 4)' },
  { name: 'shadow', className: styles.edge, transform: 'translate(7 8)' },
  { name: 'edge', className: styles.edge },
] as const

/** The two lines as letters, each with the place geometry/nameFace.ts sets it at. */
function piecesOf(owner: string, lines: readonly [string, string]): readonly Piece[] {
  return lines.flatMap((line, row) => {
    const { size, baseline } = NAME_LINES[row === 0 ? 0 : 1]
    const set = setLine(line, size, NAME_MEASURE.from, NAME_MEASURE.width)
    return set.map(({ letter, x }, index) => ({
      id: svgId(owner, `letter-${String(row)}-${String(index)}`),
      letter,
      x,
      size,
      baseline,
      endsLine: row === 0 && index === set.length - 1,
    }))
  })
}

/** Every letter once, in the order they are stuck down. Each layer is one of these. */
function Letters({ pieces }: { readonly pieces: readonly Piece[] }): ReactElement {
  return (
    <>
      {pieces.map(({ id }, index) => (
        <use
          key={id}
          className={styles.letter}
          href={fragment(id)}
          data-turn={Math.min(index, NAME_LAST_TURN)}
        />
      ))}
    </>
  )
}

/** The letters themselves, and the stripes, hot spot and band of light that make them foil. */
function Definitions({
  ids,
  pieces,
}: {
  readonly ids: DefinitionIds
  readonly pieces: readonly Piece[]
}): ReactElement {
  return (
    <defs>
      <pattern
        id={ids.stripes}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(38)"
      >
        <rect className={styles.stripe} width="1.4" height="7" />
      </pattern>
      <radialGradient
        id={ids.glow}
        gradientUnits="userSpaceOnUse"
        {...foilGlowCentre(FOIL_REST, NAME_GLOW_FIELD)}
        r="120"
      >
        <stop offset="0" className={styles.glowCentre} />
        <stop offset="1" className={styles.glowEdge} />
      </radialGradient>
      <linearGradient id={ids.shine}>
        <stop offset="0" className={styles.shineEdge} />
        <stop offset=".5" className={styles.shineCentre} />
        <stop offset="1" className={styles.shineEdge} />
      </linearGradient>
      {pieces.map(({ id, letter, x, size, baseline, endsLine }) => (
        <text key={id} id={id} className={styles.letters} x={x} y={baseline} fontSize={size}>
          {letter}
          {endsLine && ' '}
        </text>
      ))}
      <clipPath id={ids.outline}>
        {pieces.map(({ id }) => (
          <use key={id} href={fragment(id)} />
        ))}
      </clipPath>
    </defs>
  )
}

/**
 * Big holographic die-cut lettering. Every letter is a piece of its own,
 * drawn as six stacked copies, so the name can go on a letter at a time. One
 * band of light waits off the edge of the drawing to cross the foil once.
 */
export function DieCutText({ id, lines, label }: DieCutTextProps): ReactElement {
  const ids = {
    stripes: svgId(id, 'stripes'),
    glow: svgId(id, 'glow'),
    shine: svgId(id, 'shine'),
    outline: svgId(id, 'outline'),
  }
  const pieces = piecesOf(id, lines)
  const fills = [
    { name: 'foil', fill: paintRef(SHARED_IDS.foil) },
    { name: 'stripes', fill: paintRef(ids.stripes) },
    { name: 'glow', fill: paintRef(ids.glow) },
  ]

  return (
    <svg
      className={cx(paint.art, styles.name)}
      viewBox={`0 0 ${String(NAME_VIEW.width)} ${String(NAME_VIEW.height)}`}
      focusable="false"
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <Definitions ids={ids} pieces={pieces} />
      {LAYERS.map((layer) => (
        <g
          key={layer.name}
          className={layer.className}
          data-layer={layer.name}
          {...('transform' in layer ? { transform: layer.transform } : {})}
        >
          <Letters pieces={pieces} />
        </g>
      ))}
      {fills.map(({ name, fill }) => (
        <g key={name} fill={fill} data-layer={name}>
          <Letters pieces={pieces} />
        </g>
      ))}
      <g clipPath={paintRef(ids.outline)}>
        <rect className={styles.light} {...NAME_LIGHT} fill={paintRef(ids.shine)} data-light="" />
      </g>
      <g className={styles.sparks}>
        {SPARKS.map((spark) => (
          <path key={spark} className={styles.spark} d={spark} />
        ))}
      </g>
    </svg>
  )
}
