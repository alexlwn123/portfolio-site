import type { ReactElement } from 'react'

import styles from './DieCutText.module.css'
import { FOIL_REST, foilGlowCentre, NAME_GLOW_FIELD } from './geometry/foil'
import paint from './paint.module.css'
import { fragment, paintRef, SHARED_IDS, svgId } from './svgIds'

interface DieCutTextProps {
  /** The sticker this drawing belongs to. Its ids are built from it. */
  readonly id: string
  /** Two lines, each stretched to the full width. */
  readonly lines: readonly [string, string]
  /**
   * What the lettering says, when it is the only place that says it. With a
   * label the drawing is an image by that name. Without one it is decoration.
   */
  readonly label?: string | undefined
}

interface DefinitionIds {
  readonly letters: string
  readonly stripes: string
  readonly glow: string
}

/** Three twinkles, at fixed spots among the letters. */
const SPARKS = [
  'M118 34l5 13 13 5-13 5-5 13-5-13-13-5 13-5z',
  'M404 176l4 10 10 4-10 4-4 10-4-10-10-4 10-4z',
  'M300 52l3 8 8 3-8 3-3 8-3-8-8-3 8-3z',
] as const

/** The two lines of lettering, and the stripes and hot spot that make them foil. */
function Definitions({
  ids,
  lines: [first, second],
}: {
  readonly ids: DefinitionIds
  readonly lines: readonly [string, string]
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
      <g id={ids.letters} className={styles.letters}>
        <text x="240" y="142" fontSize="174" textAnchor="middle" textLength="426">
          {first}
        </text>{' '}
        <text x="240" y="264" fontSize="131" textAnchor="middle" textLength="426">
          {second}
        </text>
      </g>
    </defs>
  )
}

/** Big holographic die-cut lettering, drawn as six stacked copies of the same two lines. */
export function DieCutText({ id, lines, label }: DieCutTextProps): ReactElement {
  const ids = {
    letters: svgId(id, 'letters'),
    stripes: svgId(id, 'stripes'),
    glow: svgId(id, 'glow'),
  }
  const text = fragment(ids.letters)

  return (
    <svg
      className={paint.art}
      viewBox="0 0 480 298"
      focusable="false"
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <Definitions ids={ids} lines={lines} />
      <use href={text} className={styles.cut} transform="translate(3 4)" />
      <use href={text} className={styles.edge} transform="translate(7 8)" />
      <use href={text} className={styles.edge} />
      <use href={text} fill={paintRef(SHARED_IDS.foil)} />
      <use href={text} fill={paintRef(ids.stripes)} />
      <use href={text} fill={paintRef(ids.glow)} />
      <g className={styles.sparks}>
        {SPARKS.map((spark) => (
          <path key={spark} className={styles.spark} d={spark} />
        ))}
      </g>
    </svg>
  )
}
