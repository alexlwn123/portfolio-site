import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Pill } from './Pill'
import styles from './Pill.module.css'
import tones from './tones.module.css'

describe('Pill', () => {
  it('prints its word in its tone', () => {
    render(<Pill text="Nairobi" tone="gum" />)

    const pill = screen.getByText('Nairobi')
    expect(pill).toHaveClass(styles.pill ?? '', tones.gum ?? '')
    expect(pill).not.toHaveClass(styles.big ?? '')
  })

  it('comes a size up for a phrase', () => {
    render(<Pill text="BITCOIN & FREEDOM TECH" tone="mint" big />)

    expect(screen.getByText('BITCOIN & FREEDOM TECH')).toHaveClass(styles.big ?? '')
  })
})
