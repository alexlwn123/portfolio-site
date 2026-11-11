import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { contrastRatio } from '../../design/contrast'

const tokens = readFileSync(resolve(import.meta.dirname, '../../design/tokens.css'), 'utf8')

function token(name: string): string {
  const value = new RegExp(`--${name}:\\s*(#[0-9a-f]{6});`, 'i').exec(tokens)?.[1]
  if (value === undefined) {
    throw new Error(`tokens.css does not define --${name} as a hex colour`)
  }
  return value
}

const AA_TEXT = 4.5
const AA_LARGE_TEXT = 3

/*
 * Every pairing of lettering and vinyl on the lid, as [text, surface, where].
 * Foil and brushed metal are checked against their darkest stop.
 */
type Pairing = readonly [text: string, surface: string, where: string]

const SMALL_PRINT: readonly Pairing[] = [
  ['ink', 'white', 'hello tag, pills, badge card, bumper note, inventor ribbon'],
  ['ink', 'tang', 'hello tag bar, wins seal, bitcoin++ record, Istanbul pill, organizer ribbon'],
  ['ink', 'gum', 'lanyard, Nairobi and Austin pills, builder ribbon, first wristband'],
  ['ink', 'hi', 'bumper, Taipei and Toronto pills, winner ribbon, second wristband, NCR medal'],
  ['ink', 'mint', 'organized seal, Berlin pill, phrase pill, speaker ribbon'],
  ['ink', 'holo-2', 'foil win, hex badge, badge roles: the darkest foil stop'],
  ['ink', 'metal-mid', 'asset tag and compliance label: the darkest of their metal'],
  ['white', 'ink', 'Florianópolis pill, Pleb FM, crab caption, arcade button'],
  ['hi', 'ink', 'job title, Pleb FM name, arcade button title'],
  ['white', 'deep', 'parking sign'],
  ['white', 'cobalt', 'the saved spot, written on the lid itself'],
  ['gum-dark', 'white', '"real title" scrawl'],
]

/** What the mockup did, and the lid does not. */
const REJECTED: readonly Pairing[] = [
  ['white', 'tang', 'HELLO, the 8× and the ++ in the mockup'],
  ['white', 'gum', 'the lanyard lettering in the mockup'],
  ['gum', 'white', 'the "real title" scrawl in the mockup'],
]

describe('contrast on the lid', () => {
  it.each(SMALL_PRINT)('--%s on --%s reaches 4.5:1 (%s)', (text, surface) => {
    expect(contrastRatio(token(text), token(surface))).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each(REJECTED)(
    '--%s on --%s fails, which is why the lid does not use it (%s)',
    (text, surface) => {
      expect(contrastRatio(token(text), token(surface))).toBeLessThan(AA_TEXT)
    },
  )

  it('is why white on tangerine is not used even for display type', () => {
    expect(contrastRatio(token('white'), token('tang'))).toBeLessThan(AA_LARGE_TEXT)
  })
})
