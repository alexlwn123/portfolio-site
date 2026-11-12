import { describe, expect, it } from 'vitest'

import { content, stats } from '../../src/content'
import { readPage } from './dist'
import { INDEXABLE_ROUTES } from './routes'

/*
 * The owner's rule for the patents, checked on the pages as they are built:
 * all four filings that name him are listed together, none is labelled by
 * what became of it, and wherever they are counted the noun is "patent
 * filings". What became of each stays in the record and is never printed.
 */

const HOME = '/'
/** Wherever the home page lists or counts the filings: the lid's label, the career path, the plate. */
const HOME_PLACES = ['a[data-sticker="patents"]', 'section#work', 'section#patents'] as const
/** A status, in any of the words the site once used for one. */
const STATUS = /grant|pending|abandon/i
/** The same, in a phrase that can only be about a patent, for searching a whole page with. */
const STATUS_OF_A_PATENT =
  /(granted|pending|abandoned) (patent|application)|(patent|application)s? (granted|pending|abandoned)|patent applications?/i
/** A count of "patents": two of the four filings never became one. */
const COUNT_OF_PATENTS = /\b(\d+|two|three|four) (granted )?patents\b/i

/** Everything a page says: what it shows, and how it describes itself to a search engine. */
function wordsOf(page: Document): string {
  const described = [
    ...page.querySelectorAll('meta[name="description"], meta[property$="description"]'),
  ]
    .map((meta) => meta.getAttribute('content') ?? '')
    .join(' ')
  return `${page.title} ${described} ${page.body.textContent}`
}

describe('the patent filings, as built', () => {
  it('shows every filing in the record: none is held back', () => {
    expect(content.patents).toHaveLength(4)
    expect(content.patents.every((patent) => patent.shown)).toBe(true)
    expect(stats.patents.filings).toBe(content.patents.length)
  })

  it.each(INDEXABLE_ROUTES)('lists all four in the patents section of %s', async (route) => {
    const section = (await readPage(route)).querySelector('section#patents')

    for (const { number, title, link } of content.patents) {
      expect(section?.textContent, number.serial).toContain(number.serial)
      expect(section?.textContent, number.serial).toContain(title)
      expect(section?.querySelector(`a[href="${link.url}"]`), number.serial).not.toBeNull()
    }
    expect(section?.querySelectorAll('li a[href*="patents.google.com"]')).toHaveLength(
      content.patents.length,
    )
  })

  it('says "patent filings" wherever the home page counts them', async () => {
    const page = await readPage(HOME)
    const text = (selector: string): string =>
      page.querySelector(selector)?.textContent.replaceAll(/\s+/g, ' ') ?? ''

    expect(text('section#patents [data-count]')).toMatch(
      /Named inventor on ?4 U\.S\. patent filings/,
    )
    expect(text('section#work li[data-total="patents"]')).toMatch(/^4 patent filings$/)
    expect(text('a[data-sticker="patents"]')).toMatch(/^U\.S\. PATENT FILINGS /)
  })

  it('says it on the CV too, in its summary line', async () => {
    const section = (await readPage('/cv/')).querySelector('section#patents')

    expect(section?.textContent).toContain('Named inventor on 4 patent filings.')
  })

  it.each(HOME_PLACES)('says nothing of what became of a filing in %s', async (selector) => {
    const place = (await readPage(HOME)).querySelector(selector)

    expect(place, selector).not.toBeNull()
    expect(place?.textContent).not.toMatch(STATUS)
  })

  it('says nothing of it in the patents section of the CV', async () => {
    const section = (await readPage('/cv/')).querySelector('section#patents')

    expect(section?.textContent).not.toMatch(STATUS)
    expect(section?.querySelectorAll('li time')).toHaveLength(content.patents.length)
  })

  it.each(INDEXABLE_ROUTES)(
    'never gives a patent a status or counts "patents", anywhere on %s',
    async (route) => {
      const words = wordsOf(await readPage(route))

      expect(words).not.toMatch(STATUS_OF_A_PATENT)
      expect(words).not.toMatch(COUNT_OF_PATENTS)
    },
  )
})
