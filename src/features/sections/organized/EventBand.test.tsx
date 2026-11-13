import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { BandLook } from './bandLooks'
import { organizedCopy } from './copy'
import { EventBand } from './EventBand'
import styles from './EventBand.module.css'

const PAPER: BandLook = { kind: 'tyvek', tone: 'mint', pattern: 'stripes', thin: false }

function renderBand(look: BandLook, name = 'AI Hack for Freedom III', number = 16): HTMLElement {
  const { container } = render(<EventBand number={number} name={name} look={look} />)
  const band = container.firstElementChild
  if (!(band instanceof HTMLElement)) {
    throw new Error('Expected the band to be an element')
  }
  return band
}

describe('EventBand', () => {
  it('letters the hackathon’s name as a heading under the section’s own', () => {
    renderBand(PAPER)

    const name = screen.getByRole('heading', { level: 3 })
    expect(name).toHaveTextContent('AI Hack for Freedom III')
  })

  it('prints its number, and says it is a number to someone who cannot see the circle', () => {
    const band = renderBand(PAPER)

    expect(band).toHaveTextContent(`${organizedCopy.bandNumber(16)}AI Hack for Freedom III`)
    expect(band.querySelector('[aria-hidden="true"]')).toHaveTextContent('16')
  })

  it('reads the number before the name', () => {
    const band = renderBand(PAPER)
    const number = screen.getByText(organizedCopy.bandNumber(16))
    const name = screen.getByRole('heading', { level: 3 })

    expect(band).toContainElement(number)
    expect(number.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is cut from paper in its colour, with its printed block at the clasp', () => {
    const band = renderBand(PAPER)

    expect(band).toHaveAttribute('data-band', 'tyvek')
    expect(band).toHaveClass(styles.band ?? '', styles.tyvek ?? '', styles.mint ?? '')
    expect(band.querySelector(`.${styles.clasp ?? ''}`)).toHaveClass(styles.stripes ?? '')
    expect(band).not.toHaveClass(styles.thin ?? '')
  })

  it('is thin when the hackathon was short', () => {
    const band = renderBand({ ...PAPER, thin: true })

    expect(band).toHaveClass(styles.thin ?? '')
  })

  it('is woven cloth with a sliding bead', () => {
    const band = renderBand({ kind: 'woven', tone: 'hi', weave: 'inkTang' })

    expect(band).toHaveAttribute('data-band', 'woven')
    expect(band).toHaveClass(styles.woven ?? '', styles.hi ?? '', styles.inkTang ?? '')
    expect(band.querySelector(`.${styles.bead ?? ''}`)).not.toBeNull()
    expect(band.querySelector(`.${styles.clasp ?? ''}`)).toBeNull()
  })

  it('is moulded silicone, with nothing at the clasp', () => {
    const band = renderBand({ kind: 'silicone', tone: 'deep' })

    expect(band).toHaveClass(styles.silicone ?? '', styles.deep ?? '')
    expect(band.querySelector(`.${styles.clasp ?? ''}, .${styles.bead ?? ''}`)).toBeNull()
  })

  it('is holographic for the big one', () => {
    const band = renderBand({ kind: 'foil' })

    expect(band).toHaveAttribute('data-band', 'foil')
    expect(band).toHaveClass(styles.foil ?? '')
  })

  it('is blank for a hackathon still to come', () => {
    const band = renderBand({ kind: 'blank' }, 'AI Hack for Freedom IV', 17)

    expect(band).toHaveAttribute('data-band', 'blank')
    expect(band).toHaveClass(styles.blank ?? '')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('AI Hack for Freedom IV')
  })

  it('draws the clasp for the eye only', () => {
    const band = renderBand(PAPER)

    expect(band.querySelector(`.${styles.clasp ?? ''}`)).toHaveAttribute('aria-hidden', 'true')
    expect(band.querySelector(`.${styles.clasp ?? ''}`)).toBeEmptyDOMElement()
  })
})
