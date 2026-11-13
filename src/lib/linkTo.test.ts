import { describe, expect, it } from 'vitest'

import { content } from '../content'
import { leavesSite, linkTo } from './linkTo'

const SITE = 'https://alex.example'

describe('leavesSite', () => {
  it.each([
    'https://github.com/someone/thing',
    'http://old.example/page',
    'https://sub.alex.example/',
  ])('is true for %s, a page on another host', (href) => {
    expect(leavesSite(href, SITE)).toBe(true)
  })

  it.each(['/', '/cv/', '#work', '/#pile', 'cv/', '?print=1'])(
    'is false for %s, an address within the site',
    (href) => {
      expect(leavesSite(href, SITE)).toBe(false)
    },
  )

  it.each(['https://alex.example', 'https://alex.example/cv/', 'http://alex.example/#wins'])(
    'is false for %s, the site by its full address',
    (href) => {
      expect(leavesSite(href, SITE)).toBe(false)
    },
  )

  it.each(['mailto:someone@alex.example', 'tel:+15555550100', 'sms:+15555550100'])(
    'is false for %s, which opens no page',
    (href) => {
      expect(leavesSite(href, SITE)).toBe(false)
    },
  )

  it('is false for an address that cannot be read', () => {
    expect(leavesSite('https://', SITE)).toBe(false)
    expect(leavesSite('', SITE)).toBe(false)
  })

  it('reads the site from the profile when it is given none', () => {
    expect(leavesSite(`${content.profile.site}/cv/`)).toBe(false)
    expect(leavesSite('https://github.com/')).toBe(true)
  })
})

describe('linkTo', () => {
  it('opens a page on another host in a new tab, cut off from this one', () => {
    expect(linkTo('https://github.com/someone/thing', SITE)).toEqual({
      href: 'https://github.com/someone/thing',
      target: '_blank',
      rel: 'noopener',
    })
  })

  it.each(['/cv/', '#work', '/#pile', 'https://alex.example/cv/', 'mailto:someone@alex.example'])(
    'leaves %s in this tab',
    (href) => {
      expect(linkTo(href, SITE)).toEqual({ href })
    },
  )

  it('makes a new object each time, and never one that can be changed', () => {
    const first = linkTo('https://github.com/', SITE)
    const second = linkTo('https://github.com/', SITE)

    expect(first).not.toBe(second)
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(linkTo('/cv/', SITE))).toBe(true)
  })
})
