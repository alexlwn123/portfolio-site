import type { ReactElement } from 'react'

import type { Profile } from '../../../content'
import { cx } from '../../../lib/classNames'
import { ArrowRight } from '../../stickers/illustrations/Glyphs'
import { Lines } from '../../stickers/Lines'
import { Vinyl } from '../../stickers/Vinyl'
import voice from '../../stickers/voice.module.css'
import { Stuck } from '../Stuck'
import { contactCopy } from './copy'
import { cityLine, mailto } from './links'
import styles from './ReturnLabel.module.css'

interface ReturnLabelProps {
  readonly profile: Pick<Profile, 'name' | 'location' | 'email'>
}

/**
 * The label on the underside that gets a lost laptop home: "if found, please
 * return to", his name, his city, and the work address as the one way to
 * write to him. The address is the profile's and no other.
 */
export function ReturnLabel({ profile }: ReturnLabelProps): ReactElement {
  return (
    <Stuck className={styles.stuck}>
      <Vinyl as="div" className={styles.label}>
        <div className={styles.face} data-return-label="">
          <span className={styles.tape} aria-hidden="true" />
          <p className={cx(voice.label, styles.plea)}>
            <Lines lines={contactCopy.label.plea} />
          </p>
          <address className={styles.address}>
            <span className={cx(voice.display, styles.name)}>{profile.name}</span>{' '}
            <span className={cx(voice.label, styles.city)}>{cityLine(profile.location)}</span>{' '}
            <a className={styles.email} href={mailto(profile.email)}>
              <span className={styles.bar}>
                <span className={cx(voice.label, styles.hint)}>{contactCopy.label.email}</span>{' '}
                <span className={styles.to}>{profile.email}</span>
                <ArrowRight className={styles.arrow} />
              </span>
            </a>
          </address>{' '}
          <p className={cx(voice.marker, styles.reward)}>{contactCopy.label.reward}</p>
        </div>
      </Vinyl>
    </Stuck>
  )
}
