import { beforeEach, describe, expect, it, vi } from 'vitest'

import { keepStrapLinksInView } from './keepInView'

function strapWith(links: readonly string[]): HTMLElement {
  document.body.innerHTML = `
    <a href="/elsewhere" id="outside">outside</a>
    <nav data-pinned-strap>
      <ul>${links.map((id) => `<li><a href="/#${id}" data-to="${id}">${id}</a></li>`).join('')}</ul>
    </nav>`
  const strap = document.querySelector<HTMLElement>('[data-pinned-strap]')
  if (!strap) {
    throw new Error('The fixture has a strap')
  }
  return strap
}

function linkTo(id: string): HTMLElement {
  const link = document.querySelector<HTMLElement>(`a[data-to="${id}"]`)
  if (!link) {
    throw new Error(`The fixture has a link to ${id}`)
  }
  return link
}

/** Every link is watched for being scrolled to. jsdom has no layout, so it has no scrollIntoView. */
function watchScrolls(): ReturnType<typeof vi.fn> {
  const scrolled = vi.fn()
  for (const link of document.querySelectorAll('a')) {
    Object.defineProperty(link, 'scrollIntoView', { configurable: true, value: scrolled })
  }
  return scrolled
}

const press = (key: string): boolean =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
const point = (): boolean =>
  document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('keeping a strap link the keyboard reaches in view', () => {
  it('brings the link wholly into view, by the nearest edge, when the keyboard reaches it', () => {
    strapWith(['work', 'organized'])
    const scrolled = watchScrolls()
    expect(keepStrapLinksInView(document)).toBe(true)

    press('Tab')
    linkTo('organized').focus()

    expect(scrolled).toHaveBeenCalledTimes(1)
    expect(scrolled.mock.contexts[0]).toBe(linkTo('organized'))
    expect(scrolled).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
  })

  it('leaves a link where it is when the pointer pressed it: a link must not move under a click', () => {
    strapWith(['work', 'organized'])
    const scrolled = watchScrolls()
    keepStrapLinksInView(document)

    press('Tab')
    point()
    linkTo('organized').focus()

    expect(scrolled).not.toHaveBeenCalled()
  })

  it('has nothing to say about links outside the strap', () => {
    strapWith(['work'])
    const scrolled = watchScrolls()
    keepStrapLinksInView(document)

    press('Tab')
    document.getElementById('outside')?.focus()

    expect(scrolled).not.toHaveBeenCalled()
  })

  it('does nothing, and says so, on a page with no strap', () => {
    document.body.innerHTML = '<main><h1>Plain CV</h1></main>'

    expect(keepStrapLinksInView(document)).toBe(false)
  })

  it('throws nothing in a browser that cannot scroll an element into view', () => {
    strapWith(['work'])
    keepStrapLinksInView(document)

    press('Tab')
    expect(() => {
      linkTo('work').focus()
    }).not.toThrow()
  })
})
