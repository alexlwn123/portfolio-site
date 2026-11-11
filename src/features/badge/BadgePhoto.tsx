import type { ReactElement } from 'react'

import styles from './BadgePhoto.module.css'
import type { BadgePhotoImage } from './photoSources'

interface BadgePhotoProps {
  readonly photo: BadgePhotoImage
  readonly alt: string
}

/** The portrait on the badge: AVIF or WebP, cropped and tinted by the stylesheet. */
export function BadgePhoto({ photo, alt }: BadgePhotoProps): ReactElement {
  return (
    <div className={styles.photo}>
      <picture>
        {photo.sources.map(({ type, srcSet }) => (
          <source key={type} type={type} srcSet={srcSet} sizes={photo.sizes} />
        ))}
        <img
          className={styles.image}
          src={photo.src}
          width={photo.width}
          height={photo.height}
          alt={alt}
          decoding="async"
        />
      </picture>
    </div>
  )
}
