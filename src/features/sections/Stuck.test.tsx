import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Stuck } from './Stuck'
import styles from './Stuck.module.css'

describe('Stuck', () => {
  it('is a plain block with a sticker’s shadow', () => {
    render(<Stuck>Asset tag</Stuck>)

    const stuck = screen.getByText('Asset tag')
    expect(stuck.tagName).toBe('DIV')
    expect(stuck).toHaveClass(styles.stuck ?? '')
    expect(stuck).not.toHaveAttribute('href')
  })

  it('is a link when it leads somewhere, with a name when its face is a drawing', () => {
    render(
      <Stuck href="https://pleb.fm" label="Pleb FM">
        <svg />
      </Stuck>,
    )

    const link = screen.getByRole('link', { name: 'Pleb FM' })
    expect(link).toHaveAttribute('href', 'https://pleb.fm')
    expect(link).toHaveClass(styles.stuck ?? '', styles.lifts ?? '')
  })

  it('can be another element, and takes a class for where and how it sits', () => {
    render(
      <Stuck as="li" className="tilted">
        One of a list
      </Stuck>,
    )

    const item = screen.getByText('One of a list')
    expect(item.tagName).toBe('LI')
    expect(item).toHaveClass(styles.stuck ?? '', 'tilted')
    expect(item).not.toHaveClass(styles.lifts ?? '')
  })

  it('says it is pressed on, so the page’s script can press it on as it scrolls into view', () => {
    render(
      <>
        <Stuck>Asset tag</Stuck>
        <Stuck href="https://pleb.fm">Pleb FM</Stuck>
      </>,
    )

    expect(screen.getByText('Asset tag')).toHaveAttribute('data-stuck', '')
    expect(screen.getByRole('link', { name: 'Pleb FM' })).toHaveAttribute('data-stuck', '')
  })

  it('is never held back by its own markup: only the script, once it runs, hides it for a moment', () => {
    render(<Stuck>Asset tag</Stuck>)

    expect(screen.getByText('Asset tag')).not.toHaveAttribute('data-land')
    expect(screen.getByText('Asset tag')).not.toHaveAttribute('hidden')
    expect(screen.getByText('Asset tag')).not.toHaveAttribute('style')
  })
  it('lifts a link by its face, so that the link itself never moves under the pointer', () => {
    render(
      <>
        <Stuck href="/cv/">Plain CV</Stuck>
        <Stuck>Asset tag</Stuck>
      </>,
    )

    const link = screen.getByRole('link', { name: 'Plain CV' })
    const face = screen.getByText('Plain CV')
    expect(face).not.toBe(link)
    expect(face.parentElement).toBe(link)
    expect(face).toHaveClass(styles.face ?? '')
    expect(face).toHaveAttribute('data-stuck-face')
    // What is not a link does not lift, and has no face to lift by.
    expect(screen.getByText('Asset tag')).toHaveAttribute('data-stuck')
  })
})
