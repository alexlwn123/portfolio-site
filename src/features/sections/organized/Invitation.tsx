import type { ReactElement } from 'react'

import { cx } from '../../../lib/classNames'
import { ArrowRight } from '../../stickers/illustrations/Glyphs'
import voice from '../../stickers/voice.module.css'
import { sectionAnchor } from '../sectionIds'
import { Stuck } from '../Stuck'
import { organizedCopy } from './copy'
import styles from './Invitation.module.css'

/**
 * The invitation stuck across the end of the arm, under "room for more": a
 * label that asks whether the visitor wants a hackathon of their own, says
 * what he can do about it, and leads to the contact section. The whole label
 * is the link.
 */
export function Invitation(): ReactElement {
  const { question, offer, action } = organizedCopy.invitation

  return (
    <p className={styles.invitation} data-invitation="">
      <Stuck href={sectionAnchor('contact')} className={styles.link}>
        <span className={styles.label}>
          <span className={cx(voice.display, styles.question)}>{question}</span>{' '}
          <span className={styles.offer}>{offer}</span>{' '}
          <span className={cx(voice.label, styles.action)}>
            {action}
            <ArrowRight className={styles.arrow} />
          </span>
        </span>
      </Stuck>
    </p>
  )
}
