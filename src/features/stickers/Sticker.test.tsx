import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sticker } from './Sticker'
import styles from './Sticker.module.css'

describe('Sticker', () => {
  it('carries its id for the placement stylesheet, and no inline style', () => {
    render(<Sticker id="hello">hi</Sticker>)

    const sticker = screen.getByText('hi')
    expect(sticker).toHaveAttribute('data-sticker', 'hello')
    expect(sticker).not.toHaveAttribute('style')
    expect(sticker.tagName).toBe('DIV')
  })

  it('is a link when it has an address', () => {
    render(
      <Sticker id="cv" href="/cv/">
        Plain CV
      </Sticker>,
    )

    expect(screen.getByRole('link', { name: 'Plain CV' })).toHaveAttribute('href', '/cv/')
  })

  it('takes its accessible name from the label when its face is a drawing', () => {
    render(
      <Sticker id="wins-count" href="/cv/#wins" label="8 hackathon wins">
        <svg aria-hidden="true" />
      </Sticker>,
    )

    expect(screen.getByRole('link', { name: '8 hackathon wins' })).toBeInTheDocument()
  })

  it('can be the page heading or a navigation landmark', () => {
    render(
      <>
        <Sticker id="name" as="h1">
          Alex Lewin
        </Sticker>
        <Sticker id="elsewhere" as="nav" label="Elsewhere">
          links
        </Sticker>
      </>,
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alex Lewin')
    expect(screen.getByRole('navigation', { name: 'Elsewhere' })).toBeInTheDocument()
  })

  it('can be a second-level heading with an id of its own, for whatever it names', () => {
    render(
      <Sticker id="pile-title" as="h2" anchor="pile-title-id">
        Stuck on so far
      </Sticker>,
    )

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveAttribute('data-sticker', 'pile-title')
    expect(heading.id).toBe('pile-title-id')
  })

  it('has no id in the page unless it is given one', () => {
    const { container } = render(<Sticker id="hello">Hello</Sticker>)

    expect(container.firstElementChild).not.toHaveAttribute('id')
  })

  it('hides a decorative sticker from assistive technology', () => {
    const { container } = render(
      <Sticker id="bolt-top" decorative>
        <svg />
      </Sticker>,
    )

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('is shadowed and lifts, unless it is drawn straight onto the lid', () => {
    render(
      <>
        <Sticker id="hello">stuck</Sticker>
        <Sticker id="tally" flat>
          drawn
        </Sticker>
        <Sticker id="phrase" selfSized>
          sized
        </Sticker>
      </>,
    )

    expect(screen.getByText('stuck')).toHaveClass(styles.placed ?? '', styles.sticker ?? '')
    expect(screen.getByText('drawn')).toHaveClass(styles.placed ?? '')
    expect(screen.getByText('drawn')).not.toHaveClass(styles.sticker ?? '')
    expect(screen.getByText('sized')).toHaveClass(styles.selfSized ?? '')
    expect(screen.getByText('stuck')).not.toHaveClass(styles.selfSized ?? '')
  })

  it('says it can be picked up, unless it is drawn straight onto the lid', () => {
    render(
      <>
        <Sticker id="hello">stuck</Sticker>
        <Sticker id="tally" flat>
          drawn
        </Sticker>
      </>,
    )

    expect(screen.getByText('stuck')).toHaveAttribute('data-grab')
    expect(screen.getByText('drawn')).not.toHaveAttribute('data-grab')
  })

  it('is a button, hidden until the script that works it shows it, when it is a control', () => {
    render(
      <>
        <Sticker id="tidy" control="tidy">
          Tidy the lid
        </Sticker>
        <Sticker id="sound" control="sound" toggle label="Sound">
          <svg aria-hidden="true" />
        </Sticker>
      </>,
    )

    const tidy = screen.getByText('Tidy the lid')
    const sound = screen.getByLabelText('Sound')
    expect(tidy.tagName).toBe('BUTTON')
    expect(tidy).toHaveAttribute('type', 'button')
    expect(tidy).toHaveAttribute('hidden')
    expect(tidy).toHaveAttribute('data-control', 'tidy')
    expect(tidy).toHaveAttribute('data-sticker', 'tidy')
    expect(tidy).toHaveClass(styles.control ?? '', styles.sticker ?? '')
    expect(tidy).not.toHaveAttribute('aria-pressed')
    expect(sound).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stays a link when it has an address, whatever else it is told', () => {
    render(
      <Sticker id="cv" href="/cv/" control="tidy">
        Plain CV
      </Sticker>,
    )

    expect(screen.getByRole('link', { name: 'Plain CV' })).not.toHaveAttribute('hidden')
    expect(screen.getByRole('link', { name: 'Plain CV' })).not.toHaveAttribute('data-control')
  })

  it('leaves aria-hidden off everything else', () => {
    const { container } = render(<Sticker id="phrase">text</Sticker>)

    expect(container.firstElementChild).not.toHaveAttribute('aria-hidden')
    expect(container.firstElementChild).not.toHaveAttribute('aria-label')
    expect(container.firstElementChild).not.toHaveAttribute('href')
  })
})
