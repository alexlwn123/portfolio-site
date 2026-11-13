import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { STAR_PATH } from '../../stickers/illustrations/Glyphs'
import paint from '../../stickers/paint.module.css'
import { fragment, svgId } from '../../stickers/svgIds'
import voice from '../../stickers/voice.module.css'
import { organizedCopy } from './copy'
import styles from './Hand.module.css'

interface HandProps {
  /** What the stamp on the palm says: the role, then the year it began. */
  readonly stamp: { readonly role: string; readonly since: string | null }
}

const OWNER = 'organized-hand'

/** Where the stamp's two lines stand, and where the one line stands alone. */
const STAMP_LINES = [
  { y: '227', size: '22' },
  { y: '250', size: '21' },
] as const
const LONE_LINE = { y: '239', size: '22' } as const

/**
 * Four fingers, a thumb and a palm, as the mockup drew them, except where the
 * palm ends. The mockup's palm ran on, round-cornered, past the wrist, and its
 * corners showed between the first bands. This one stops square at the wrist,
 * under the first band, where the forearm takes over at the same width.
 */
function Shape({ id }: { readonly id: string }): ReactElement {
  return (
    <g id={id}>
      <rect x="64" y="40" width="42" height="170" rx="21" transform="rotate(-8 85 200)" />
      <rect x="108" y="14" width="42" height="190" rx="21" transform="rotate(-2 129 200)" />
      <rect x="152" y="28" width="42" height="180" rx="21" transform="rotate(4 173 200)" />
      <rect x="196" y="66" width="38" height="140" rx="19" transform="rotate(10 215 200)" />
      <rect x="18" y="150" width="46" height="130" rx="23" transform="rotate(-36 64 268)" />
      <path d="M62 300V196a46 46 0 0 1 46-46h84a46 46 0 0 1 46 46v104z" />
    </g>
  )
}

/** The shine down each finger and the creases where the fingers meet the palm. */
function Creases(): ReactElement {
  return (
    <g className={styles.creases}>
      <path
        className={styles.shine}
        d="M78 196 L72 66 M122 190 L119 40 M166 190 L170 52 M207 192 L221 92"
        strokeWidth="7"
      />
      <path
        className={paint.inkLine}
        d="M108 196 L107 150 M152 196 L152 146 M194 198 L197 156 M66 214 Q70 250 92 268"
        strokeWidth="6"
      />
    </g>
  )
}

/**
 * The stamp from the door, a little crooked: an oval with the role over the
 * year and a star at either end. The mockup's stamp was round, with lettering
 * too small to read on a phone. This one is lettered large enough to.
 */
function Stamp({ role, since }: HandProps['stamp']): ReactElement {
  const lines = since === null ? [role] : [role, since]

  return (
    <g className={styles.stamp} data-stamp="" transform="rotate(-11 150 234)">
      <ellipse className={styles.ring} cx="150" cy="234" rx="80" ry="40" strokeWidth="3.4" />
      <ellipse
        className={styles.ring}
        cx="150"
        cy="234"
        rx="73"
        ry="33.5"
        strokeWidth="1.3"
        strokeDasharray="2 3"
      />
      {lines.map((line, index) => {
        const { y, size } = (lines.length === 1 ? LONE_LINE : STAMP_LINES[index]) ?? LONE_LINE
        return (
          <text
            key={line}
            className={cx(voice.label, styles.lettering)}
            x="150"
            y={y}
            fontSize={size}
            textAnchor="middle"
          >
            {line}
          </text>
        )
      })}
      <path className={styles.lettering} d={STAR_PATH} transform="translate(85 234)" />
      <path className={styles.lettering} d={STAR_PATH} transform="translate(215 234)" />
    </g>
  )
}

/**
 * A hand held up for a high five, stamped at the door. The wristbands start
 * where it ends. An image: its name says what the stamp says.
 */
export function Hand({ stamp }: HandProps): ReactElement {
  const shape = svgId(OWNER, 'shape')
  const drawn = fragment(shape)
  const lettered = [stamp.role, ...(stamp.since === null ? [] : [stamp.since])].join(' ')

  return (
    <svg
      className={cx(paint.art, styles.hand)}
      viewBox="0 0 300 310"
      role="img"
      aria-label={organizedCopy.hand(lettered)}
      focusable="false"
    >
      <defs>
        <Shape id={shape} />
      </defs>
      <use href={drawn} className={styles.cut} />
      <use href={drawn} className={styles.edge} />
      <use href={drawn} className={paint.gum} />
      <Creases />
      <Stamp {...stamp} />
    </svg>
  )
}
