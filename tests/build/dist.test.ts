import { describe, expect, it } from 'vitest'

import { content } from '../../src/content'
import { PERSONAL_MAIL_DOMAINS } from '../../src/content/schema'
import { SECTIONS } from '../../src/features/cv/labels'
import { STICKER_IDS } from '../../src/features/lid/stickers'
import { executableScripts, listDistFiles, readDistFile, readPage } from './dist'
import { INDEXABLE_ROUTES, ROUTES } from './routes'

const SITE_ORIGIN = new URL(content.profile.site).origin

describe('the built site', () => {
  it.each(ROUTES)('emits static HTML for every route: %s', async (route) => {
    const page = await readPage(route)
    const main = page.querySelector('main')

    expect(main, `${route} has a <main>`).not.toBeNull()
    expect(main?.textContent.trim()).not.toBe('')
  })

  it.each(ROUTES)('every route has exactly one h1: %s', async (route) => {
    const page = await readPage(route)

    expect(page.querySelectorAll('h1')).toHaveLength(1)
  })

  it.each(ROUTES)('declares its language, viewport and title: %s', async (route) => {
    const page = await readPage(route)
    const viewport = page.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? ''

    expect(page.documentElement.lang).toBe('en')
    expect(page.title.trim()).not.toBe('')
    expect(viewport).toContain('width=device-width')
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale/i)
  })

  it.each(ROUTES)('hydrates nothing and has no inline styles: %s', async (route) => {
    const page = await readPage(route)

    expect(page.querySelectorAll('astro-island')).toHaveLength(0)
    expect(executableScripts(page)).toHaveLength(0)
    expect(page.querySelectorAll('[style]')).toHaveLength(0)
  })

  it.each(ROUTES)('loads nothing from another host: %s', async (route) => {
    const page = await readPage(route)
    const loaded = [
      ...[...page.querySelectorAll('link[href]')]
        .filter((link) => link.getAttribute('rel') !== 'canonical')
        .map((link) => link.getAttribute('href')),
      ...[...page.querySelectorAll('[src]')].map((element) => element.getAttribute('src')),
    ]
    const css = [...page.querySelectorAll('style')].map((style) => style.textContent).join('\n')

    for (const url of loaded) {
      expect(url).toMatch(/^\/(?!\/)/)
    }
    expect(css).not.toMatch(/url\(\s*["']?(https?:)?\/\//)
    expect(css).not.toContain('@import')
  })
})

describe('/cv/', () => {
  it('/cv/ has no script tags (the JSON-LD data block aside)', async () => {
    const page = await readPage('/cv/')
    const scripts = [...page.querySelectorAll('script')]

    expect(executableScripts(page)).toHaveLength(0)
    expect(scripts.every((script) => !script.hasAttribute('src'))).toBe(true)
    expect(scripts.map((script) => script.type)).toEqual(['application/ld+json'])
  })

  it('has every section anchor', async () => {
    const page = await readPage('/cv/')
    const ids = [...page.querySelectorAll('main > section')].map((section) => section.id)

    expect(ids).toEqual(SECTIONS.map(({ id }) => id))
  })

  it('links back to the home page, and the home page links to it', async () => {
    const cv = await readPage('/cv/')
    const home = await readPage('/')

    expect(cv.querySelector('a[href="/"]')).not.toBeNull()
    expect(home.querySelector('a[href="/cv/"]')).not.toBeNull()
  })

  it('has a print stylesheet that writes out link addresses', async () => {
    const page = await readPage('/cv/')
    const stylesheets = await Promise.all(
      [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
        readDistFile((link.getAttribute('href') ?? '').replace(/^\//, '')),
      ),
    )
    const css = [
      ...stylesheets,
      ...[...page.querySelectorAll('style')].map((style) => style.textContent),
    ].join('\n')

    expect(css).toMatch(/@media print/)
    expect(css).toMatch(/attr\(href\)/)
  })
})

describe('/', () => {
  async function homeCss(): Promise<string> {
    const page = await readPage('/')
    const sheets = await Promise.all(
      [...page.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
        readDistFile((link.getAttribute('href') ?? '').replace(/^\//, '')),
      ),
    )
    return sheets.join('\n')
  }

  it('places every sticker from a stylesheet, with the phone layout in a container query', async () => {
    const page = await readPage('/')
    const css = await homeCss()
    const ids = [...page.querySelectorAll('[data-sticker]')].map((sticker) =>
      sticker.getAttribute('data-sticker'),
    )

    expect(ids).toEqual(STICKER_IDS)
    for (const id of STICKER_IDS) {
      expect(css, id).toMatch(new RegExp(`\\[data-sticker="?${id}"?\\]\\{`))
    }
    expect(css).toMatch(/@container lid \((max-width:\s*560px|width\s*<=\s*560px)\)/)
    expect(css).toMatch(/container:\s*lid\s*\/\s*inline-size/)
  })

  it('links only to CV sections that exist', async () => {
    const home = await readPage('/')
    const cv = await readPage('/cv/')
    const anchors = [...home.querySelectorAll('a[href^="/cv/#"]')].map(
      (link) => link.getAttribute('href')?.split('#')[1] ?? '',
    )

    expect(new Set(anchors)).toEqual(new Set(['organized', 'wins', 'talks', 'projects', 'patents']))
    for (const anchor of anchors) {
      expect(cv.getElementById(anchor), anchor).not.toBeNull()
    }
    expect(home.querySelector('a[href^="#"]')).toBeNull()
  })

  it('embeds nothing as a data: URI, in the page or in its stylesheets', async () => {
    const page = await readPage('/')

    expect(page.documentElement.outerHTML).not.toMatch(/data:(image|font|application)/)
    expect(await homeCss()).not.toMatch(/url\(\s*["']?data:/)
  })

  it('publishes the badge photo as AVIF and WebP, and keeps the original out of the build', async () => {
    const page = await readPage('/')
    const files = await listDistFiles()
    const candidates = [...page.querySelectorAll('picture source')].flatMap((source) =>
      (source.getAttribute('srcset') ?? '').split(', ').map((candidate) => candidate.split(' ')[0]),
    )

    expect(candidates.some((url) => url?.endsWith('.avif'))).toBe(true)
    expect(candidates.some((url) => url?.endsWith('.webp'))).toBe(true)
    for (const url of candidates) {
      expect(files).toContain((url ?? '').replace(/^\//, ''))
    }
    expect(files.filter((file) => file.endsWith('.png') && file.includes('alex-lewin'))).toEqual([])
    expect(page.querySelector('picture img')?.getAttribute('alt')).toMatch(/smiling/)
  })
})

describe('the additions to the lid', () => {
  it('prints the granted patent numbers from the content, and no application’s', async () => {
    const page = await readPage('/')
    const label = page.querySelector('a[data-sticker="patents"]')
    const granted = content.patents.filter((patent) => patent.status.kind === 'granted')

    expect(label?.getAttribute('href')).toBe('/cv/#patents')
    expect(granted).toHaveLength(2)
    for (const patent of content.patents) {
      const printed = label?.textContent.includes(patent.number.serial) ?? false
      expect(printed, patent.number.serial).toBe(patent.status.kind === 'granted')
    }
    expect(label?.textContent).toContain('OTHER PATENTS PENDING')
  })

  it('has five ribbons, the last of them to the patents', async () => {
    const page = await readPage('/')
    const ribbons = [...page.querySelectorAll('nav[aria-label="Sections"] a')]

    expect(ribbons.map((ribbon) => ribbon.getAttribute('href'))).toEqual([
      '/cv/#organized',
      '/cv/#wins',
      '/cv/#talks',
      '/cv/#projects',
      '/cv/#patents',
    ])
    expect(ribbons.at(-1)?.textContent).toBe('INVENTOR')
  })

  it('links the NCR medal to the wins, named in words', async () => {
    const page = await readPage('/')
    const medal = page.querySelector('a[data-sticker="ncr-win"]')

    expect(medal?.getAttribute('href')).toBe('/cv/#wins')
    expect(medal?.getAttribute('aria-label')).toBe(
      '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads',
    )
  })

  it('shows nine wins wherever the lid counts them', async () => {
    const page = await readPage('/')
    const text = page.querySelector('main')?.textContent ?? ''

    expect(text).toContain('9×')
    expect(text).toContain('×9')
    expect(page.querySelector('a[aria-label="9 hackathon wins"]')).not.toBeNull()
  })
})

describe('metadata', () => {
  it.each(INDEXABLE_ROUTES)('gives %s a canonical URL and valid Person JSON-LD', async (route) => {
    const page = await readPage(route)
    const canonical = page.querySelector('link[rel="canonical"]')?.getAttribute('href')
    const jsonLd = page.querySelector('script[type="application/ld+json"]')?.textContent ?? ''
    const person = JSON.parse(jsonLd) as Record<string, unknown>

    expect(canonical).toBe(`${SITE_ORIGIN}${route}`)
    expect(person['@type']).toBe('Person')
    expect(person.name).toBe(content.profile.name)
    expect(jsonLd).not.toContain('<')
  })

  it('keeps the 404 page out of search results', async () => {
    const page = await readPage('/404.html')

    expect(page.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
    expect(page.querySelector('link[rel="canonical"]')).toBeNull()
  })

  it('ships the social image and every icon the pages point at', async () => {
    const files = await listDistFiles()
    const page = await readPage('/')
    const image = page.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? ''
    const icons = [...page.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].map(
      (link) => (link.getAttribute('href') ?? '').replace(/^\//, ''),
    )

    expect(image.startsWith(`${SITE_ORIGIN}/`)).toBe(true)
    expect(files).toContain(image.slice(SITE_ORIGIN.length + 1))
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) {
      expect(files).toContain(icon)
    }
  })

  it('ships a web manifest named after him, with icons that exist', async () => {
    const files = await listDistFiles()
    const manifest = JSON.parse(await readDistFile('site.webmanifest')) as {
      name: string
      short_name: string
      icons: readonly { src: string }[]
    }

    expect(manifest.name).toBe(content.profile.name)
    expect(manifest.short_name.length).toBeLessThanOrEqual(manifest.name.length)
    for (const icon of manifest.icons) {
      expect(files).toContain(icon.src.replace(/^\//, ''))
    }
  })
})

describe('what must not ship', () => {
  it('keeps zod out of every browser bundle', async () => {
    const scripts = (await listDistFiles()).filter((file) => /\.(js|mjs)$/.test(file))
    const sources = await Promise.all(scripts.map((file) => readDistFile(file)))

    for (const source of sources) {
      expect(source).not.toMatch(/ZodError|zod/i)
      expect(source).not.toContain(content.profile.email)
    }
  })

  it('publishes the work email and no personal mailbox', async () => {
    const pages = await Promise.all(ROUTES.map((route) => readPage(route)))
    const mailtos = pages.flatMap((page) =>
      [...page.querySelectorAll('a[href^="mailto:"]')].map((link) => link.getAttribute('href')),
    )
    const text = pages.map((page) => page.documentElement.outerHTML.toLowerCase()).join('\n')

    expect(mailtos.length).toBeGreaterThan(0)
    expect(new Set(mailtos)).toEqual(new Set([`mailto:${content.profile.email}`]))
    for (const domain of PERSONAL_MAIL_DOMAINS) {
      expect(text).not.toContain(`@${domain}`)
    }
  })
})
