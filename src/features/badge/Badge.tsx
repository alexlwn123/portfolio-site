import type { ReactElement } from 'react'

import { cx } from '../../lib/classNames'
import foil from '../stickers/foil.module.css'
import { paintRef, svgId } from '../stickers/svgIds'
import voice from '../stickers/voice.module.css'
import styles from './Badge.module.css'
import { BadgePhoto } from './BadgePhoto'
import type { BadgePhotoImage } from './photoSources'
import { type Ribbon, SectionRibbons } from './SectionRibbons'

export interface BadgeProps {
  /** The sticker id the badge is placed under. Its SVG ids are built from it. */
  readonly id: string
  readonly photo: BadgePhotoImage
  readonly photoAlt: string
  /** What he does at these events, across the top of the card. */
  readonly roles: readonly string[]
  readonly givenName: string
  readonly familyName: string
  /** His job title, exactly as it is printed on his business card. */
  readonly title: string
  readonly organization: string
  readonly ribbonsLabel: string
  readonly ribbons: readonly Ribbon[]
}

/** The metal clip that joins the lanyard to the sleeve. */
function Clip({ id }: { readonly id: string }): ReactElement {
  const metal = svgId(id, 'metal')

  return (
    <svg className={styles.clip} viewBox="0 0 260 300" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={styles.metalLight} />
          <stop offset=".5" className={styles.metalMid} />
          <stop offset="1" className={styles.metalShine} />
        </linearGradient>
      </defs>
      <rect
        className={styles.metalEdge}
        x="106"
        y="256"
        width="48"
        height="22"
        rx="5"
        fill={paintRef(metal)}
        strokeWidth="1"
      />
      <circle cx="130" cy="288" r="10" fill="none" stroke={paintRef(metal)} strokeWidth="4.5" />
      <rect
        className={styles.strapLoop}
        x="122"
        y="292"
        width="16"
        height="42"
        rx="6"
        strokeWidth="1.2"
      />
      <circle
        className={styles.metalEdge}
        cx="130"
        cy="304"
        r="4.2"
        fill={paintRef(metal)}
        strokeWidth=".8"
      />
    </svg>
  )
}

type CardProps = Omit<BadgeProps, 'id' | 'ribbonsLabel' | 'ribbons'>

function Card(props: CardProps): ReactElement {
  const { roles, photo, photoAlt, givenName, familyName, title, organization } = props

  return (
    <div className={styles.card}>
      <ul className={cx(voice.label, foil.foil, styles.roles)} role="list">
        {roles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
      <BadgePhoto photo={photo} alt={photoAlt} />
      <p className={styles.name}>
        <span className={cx(voice.display, styles.given)}>{givenName}</span>{' '}
        <span className={cx(voice.label, styles.family)}>{familyName}</span>
      </p>
      <p className={cx(voice.label, styles.title)}>{title}</p>
      <p className={styles.organization}>{organization}</p>
    </div>
  )
}

/**
 * His conference badge: photo, name and real job title in a clear sleeve,
 * with the section ribbons stuck underneath.
 */
export function Badge({ id, ribbonsLabel, ribbons, ...card }: BadgeProps): ReactElement {
  return (
    <>
      <Clip id={id} />
      <div className={styles.badge} data-badge-card="">
        <div className={styles.sleeve}>
          <Card {...card} />
        </div>
        <SectionRibbons label={ribbonsLabel} ribbons={ribbons} />
      </div>
    </>
  )
}
