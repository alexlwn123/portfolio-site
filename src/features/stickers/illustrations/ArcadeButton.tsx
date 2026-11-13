import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import paint from '../paint.module.css'
import { fragment, paintRef, svgId } from '../svgIds'
import voice from '../voice.module.css'
import styles from './ArcadeButton.module.css'

interface ArcadeButtonProps {
  /** The sticker this drawing belongs to. Its ids are built from it. */
  readonly id: string
  /** Set around the top of the button. */
  readonly top: string
  /** Set around the bottom. */
  readonly bottom: string
}

/** A big round arcade button with its name lettered around it. */
export function ArcadeButton({ id, top, bottom }: ArcadeButtonProps): ReactElement {
  const [upper, lower, dome] = [svgId(id, 'upper'), svgId(id, 'lower'), svgId(id, 'dome')]

  return (
    <svg className={paint.art} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={dome} cx=".36" cy=".3" r=".85">
          <stop offset="0" className={styles.domeLight} />
          <stop offset=".45" className={styles.domeMid} />
          <stop offset="1" className={styles.domeDark} />
        </radialGradient>
        <path id={upper} d="M33,100 a67,67 0 0,1 134,0" />
        <path id={lower} d="M23,100 a77,77 0 0,0 154,0" />
      </defs>
      <circle className={paint.white} cx="100" cy="100" r="97" />
      <circle className={paint.ink} cx="100" cy="100" r="89" />
      <text className={cx(voice.display, styles.title)} fontSize="18">
        <textPath href={fragment(upper)} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text className={cx(voice.label, styles.small)} fontSize="12.5">
        <textPath href={fragment(lower)} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>
      <ellipse className={styles.base} cx="100" cy="110" rx="47" ry="43" />
      <circle cx="100" cy="99" r="44" fill={paintRef(dome)} />
      <ellipse
        className={styles.shine}
        cx="86"
        cy="80"
        rx="17"
        ry="9"
        transform="rotate(-28 86 80)"
      />
    </svg>
  )
}
