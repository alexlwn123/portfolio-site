import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Sticker } from './Sticker'
import styles from './Sticker.module.css'

/** The sticker some words are printed on: the words sit on its face, inside it. */
function stickerOf(words: string): HTMLElement {
  const sticker = screen.getByText(words).closest<HTMLElement>('[data-sticker]')
  if (!sticker) {
    throw new Error(`Nothing with "${words}" on it is a sticker`)
  }
  return sticker
}

describe('Sticker', () => {
  it('carries its id for the placement stylesheet, and no inline style', () => {
    render(<Sticker id="hello">hi</Sticker>)

    const sticker = stickerOf('hi')
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

    const link = screen.getByRole('link', { name: 'Plain CV' })
    expect(link).toHaveAttribute('href', '/cv/')
    expect(link).not.toHaveAttribute('target')
    expect(link).not.toHaveAttribute('rel')
  })

  it('opens an address that leaves the site in a new tab', () => {
    render(
      <Sticker id="github" href="https://example.test/code">
        Code
      </Sticker>,
    )

    const link = screen.getByRole('link', { name: 'Code' })
    expect(link).toHaveAttribute('href', 'https://example.test/code')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener')
  })

  it('has no address, and nothing about a tab, when it is not a link', () => {
    render(<Sticker id="plain">plain</Sticker>)

    const sticker = stickerOf('plain')
    expect(sticker).not.toHaveAttribute('href')
    expect(sticker).not.toHaveAttribute('target')
    expect(sticker).not.toHaveAttribute('rel')
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

    expect(stickerOf('stuck')).toHaveClass(styles.placed ?? '', styles.sticker ?? '')
    expect(stickerOf('drawn')).toHaveClass(styles.placed ?? '')
    expect(stickerOf('drawn')).not.toHaveClass(styles.sticker ?? '')
    expect(stickerOf('sized')).toHaveClass(styles.selfSized ?? '')
    expect(stickerOf('stuck')).not.toHaveClass(styles.selfSized ?? '')
  })

  it('lifts by its face, so that the sticker itself never moves under the pointer', () => {
    render(
      <>
        <Sticker id="hello">stuck</Sticker>
        <Sticker id="cv" href="/cv/">
          linked
        </Sticker>
        <Sticker id="tidy" control="tidy">
          pressed
        </Sticker>
        <Sticker id="tally" flat>
          drawn
        </Sticker>
      </>,
    )

    for (const words of ['stuck', 'linked', 'pressed']) {
      const face = screen.getByText(words)
      expect(face).toHaveClass(styles.face ?? '')
      expect(face).toHaveAttribute('data-sticker-face')
      expect(face.parentElement).toBe(stickerOf(words))
      expect(stickerOf(words).children).toHaveLength(1)
    }
    // A div where a div is allowed, a span where only words are.
    expect(screen.getByText('stuck').tagName).toBe('DIV')
    expect(screen.getByText('linked').tagName).toBe('SPAN')
    expect(screen.getByText('pressed').tagName).toBe('SPAN')
    // What is drawn straight onto the lid does not lift, and has no face to lift by.
    expect(screen.getByText('drawn')).toBe(stickerOf('drawn'))
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

    expect(stickerOf('stuck')).toHaveAttribute('data-grab')
    expect(stickerOf('drawn')).not.toHaveAttribute('data-grab')
  })

  it('is a button, hidden until the script that works it shows it, when it is a control', () => {
    render(
      <>
        <Sticker id="tidy" control="tidy">
          Reset stickers
        </Sticker>
        <Sticker id="sound" control="sound" toggle label="Sound">
          <svg aria-hidden="true" />
        </Sticker>
      </>,
    )

    const tidy = stickerOf('Reset stickers')
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
