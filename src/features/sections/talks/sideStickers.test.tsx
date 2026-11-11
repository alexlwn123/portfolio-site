import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { BackstagePass } from './BackstagePass'
import { Clipping, SeeAlso } from './Clipping'
import { pressCuttings } from './clippings'
import { EditionCard } from './EditionCard'
import { OnAirSticker } from './OnAirSticker'
import { onAirShows, workshopPass } from './tour'

const [show] = onAirShows(content.talks)
const pass = workshopPass(content.talks)
const { clippings, references } = pressCuttings(content)

if (!show || !pass) {
  throw new Error('The records no longer have the show or the workshop these tests are about')
}

describe('OnAirSticker', () => {
  it('is a lit sign over the name of the show, which heads it', () => {
    render(<OnAirSticker show={show} />)
    const sticker = screen.getByRole('article', { name: 'BitDevs Radio Hour' })

    expect(sticker).toHaveTextContent('On air')
    expect(within(sticker).getByRole('heading', { level: 3 })).toHaveTextContent(
      'BitDevs Radio Hour',
    )
    expect(sticker).toHaveAttribute('data-talk', 'bitdevs-radio-hour')
  })

  it('says he co-hosts it, that it is still running, and what it is', () => {
    render(<OnAirSticker show={show} />)
    const sticker = screen.getByRole('article')

    expect(sticker).toHaveTextContent('Podcast')
    expect(sticker).toHaveTextContent('Co-host')
    expect(sticker).toHaveTextContent('Ongoing')
    expect(sticker).toHaveTextContent(
      'A weekly podcast on technical bitcoin news, with Stephen DeLorme',
    )
  })

  it('links to everywhere the show can be heard', () => {
    render(<OnAirSticker show={show} />)

    expect(
      screen.getByRole('link', { name: 'Playlist on YouTube: BitDevs Radio Hour' }),
    ).toHaveAttribute(
      'href',
      'https://youtube.com/playlist?list=PLy-DXclpjVLJZGXeBDY-9T2HoG708WfnX',
    )
    expect(
      screen.getByRole('link', { name: 'Apple Podcasts: BitDevs Radio Hour' }),
    ).toHaveAttribute('href', 'https://podcasts.apple.com/podcast/id1791756302')
  })

  it('leaves out the description when the record has none', () => {
    render(<OnAirSticker show={{ ...show, detail: null }} />)

    expect(screen.getByRole('article')).not.toHaveTextContent('weekly')
  })
})

describe('EditionCard', () => {
  function renderCard(): HTMLElement {
    render(<EditionCard record={content.bitcoinPlusPlus} stats={stats.bitcoinPlusPlus} />)
    return screen.getByRole('article', { name: 'bitcoin++' })
  }

  it('prints the record’s numbers from the derived stats', () => {
    const card = renderCard()

    expect(card).toHaveTextContent('13 editions')
    expect(card).toHaveTextContent('51 stage sessions')
    expect(card).toHaveTextContent('member since 2023')
    expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent('bitcoin++')
  })

  it('is stamped once for every edition, in the order he went', () => {
    const card = renderCard()
    const stamps = within(
      within(card).getByRole('list', { name: 'bitcoin++ editions attended' }),
    ).getAllByRole('listitem')

    expect(stamps).toHaveLength(stats.bitcoinPlusPlus.editions)
    expect(stamps).toHaveLength(13)
    expect(stamps[0]).toHaveTextContent(/^Austin\s*2023$/)
    expect(stamps.at(-1)).toHaveTextContent(/^Toronto\s*2026$/)
    content.bitcoinPlusPlus.editions.forEach(({ city, year }, index) => {
      expect(stamps[index]).toHaveTextContent(city)
      expect(stamps[index]).toHaveTextContent(String(year))
    })
  })

  it('links the record sticker to his community profile', () => {
    const card = renderCard()

    expect(within(card).getByRole('link')).toHaveAttribute(
      'href',
      'https://btcpp.dev/whois/alexlwn123',
    )
    expect(within(card).getByRole('link')).toHaveAccessibleName(/bitcoin\+\+/)
  })

  it('leaves room for the next stamp, as furniture', () => {
    const card = renderCard()
    const blanks = card.querySelectorAll('[data-blank]')

    expect(blanks.length).toBeGreaterThan(0)
    for (const blank of blanks) {
      expect(blank).toHaveAttribute('aria-hidden', 'true')
    }
    expect(card.querySelector('[style]')).toBeNull()
  })
})

describe('BackstagePass', () => {
  it('is for the workshop, by name, and says it is one', () => {
    render(<BackstagePass pass={pass} />)
    const sticker = screen.getByRole('article', { name: /^How to Win\s*Every Hackathon$/ })

    expect(sticker).toHaveTextContent('Backstage')
    expect(sticker).toHaveTextContent('Workshop')
    expect(sticker).toHaveTextContent('a real workshop I teach')
  })

  it('counts the times it was given from the records, and says where and when', () => {
    render(<BackstagePass pass={pass} />)
    const runs = within(screen.getByRole('article')).getAllByRole('listitem')

    expect(screen.getByRole('article')).toHaveTextContent('given ×2')
    expect(runs.slice(0, 2).map((run) => run.textContent)).toEqual([
      expect.stringMatching(/^bitcoin\+\+ Florianópolis\s*2025$/),
      expect.stringMatching(/^bitcoin\+\+ Buenos Aires\s*2024$/),
    ])
  })

  it('links to the recording', () => {
    render(<BackstagePass pass={pass} />)

    expect(
      screen.getByRole('link', { name: 'Video on YouTube: How to Win Every Hackathon' }),
    ).toHaveAttribute('href', 'https://www.youtube.com/watch?v=X9yLrPk_LnE')
  })

  it('copes with a run whose place and year are not recorded, and a workshop with no format', () => {
    render(
      <BackstagePass
        pass={{ ...pass, format: null, given: [{ id: 'somewhere', venue: null, year: null }] }}
      />,
    )

    expect(screen.getByRole('article')).toHaveTextContent('given ×1')
    expect(screen.getByRole('article')).not.toHaveTextContent('Workshop')
    expect(
      screen.queryAllByRole('listitem').filter((item) => item.hasAttribute('data-run')),
    ).toEqual([])
  })
})

describe('Clipping', () => {
  const [npr, hrf] = clippings

  if (!npr || !hrf) {
    throw new Error('The records no longer have the two press items these tests are about')
  }

  it('prints the outlet, the programme, the headline as a link, the byline and the date', () => {
    render(<Clipping clipping={npr} />)
    const cutting = screen.getByRole('article', { name: /^NPR/ })

    expect(cutting).toHaveTextContent('All Things Considered')
    expect(
      within(cutting).getByRole('link', {
        name: 'Human rights activists look to harness AI for the greater good',
      }),
    ).toHaveAttribute('href', npr.url)
    expect(cutting).toHaveTextContent('Reported by Jenna McLaughlin')
    expect(cutting.querySelector('time')).toHaveAttribute('datetime', '2026-10-27')
    expect(cutting.querySelector('time')).toHaveTextContent('October 27, 2026')
  })

  it('claims only what the record allows: a hackathon he helped organize was covered', () => {
    render(<Clipping clipping={npr} />)
    const cutting = screen.getByRole('article')

    expect(cutting).toHaveTextContent(
      'Coverage of AI Hack for Freedom III in Washington, DC, a hackathon he helped organize.',
    )
    expect(cutting).toHaveTextContent('The piece names neither the event nor him.')
    expect(cutting).not.toHaveTextContent(/as heard on|featured|interview/i)
    expect(cutting).toHaveAttribute('data-press', 'npr-all-things-considered')
  })

  it('makes the claim the link when there is no headline to print', () => {
    render(<Clipping clipping={hrf} />)
    const cutting = screen.getByRole('article', { name: /^Human Rights Foundation/ })

    expect(
      within(cutting).getByRole('link', {
        name: 'Announcement of the AI Hack for Freedom I winners, with Stringer Safety placed 1st.',
      }),
    ).toHaveAttribute('href', hrf.url)
    expect(cutting).toHaveTextContent('The announcement does not name him.')
    expect(cutting).not.toHaveTextContent('Reported by')
    expect(cutting.textContent.match(/Announcement of/g)).toHaveLength(1)
  })

  it('prints no date and no note when the record has neither', () => {
    render(<Clipping clipping={{ ...hrf, date: null, naming: null }} />)

    expect(screen.getByRole('article').querySelector('time')).toBeNull()
    expect(screen.getByRole('article')).not.toHaveTextContent('does not name')
  })
})

describe('SeeAlso', () => {
  it('points at a reference page by what it lists, and claims nothing', () => {
    render(<SeeAlso references={references} />)

    expect(screen.getByText('See also')).toBeVisible()
    expect(
      screen.getByRole('link', { name: /^Winners of all three editions\s*: AI Hack for Freedom$/ }),
    ).toHaveAttribute('href', 'https://www.aihackforfreedom.org/winners.html')
  })

  it('renders nothing when there is nothing to point at', () => {
    const { container } = render(<SeeAlso references={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
