import { beforeEach, describe, expect, it } from 'vitest'

import {
  CARD_BOX,
  HANG_BOX,
  lidFixture,
  type LidFixture,
  place,
  placeHang,
} from '../../../test/lidFixture'
import { findHang, measureHang, sameRig } from './badgeMeasure'

let fixture: LidFixture

beforeEach(() => {
  fixture = lidFixture()
})

function parts() {
  const found = findHang(fixture.lid)
  if (found === null) {
    throw new Error('The fixture has a lanyard and a badge')
  }
  return found
}

describe('finding the lanyard and the badge', () => {
  it('finds both stickers, the card and the two straps, left first', () => {
    const found = parts()

    expect(found.lanyard).toBe(fixture.sticker('lanyard'))
    expect(found.badge).toBe(fixture.sticker('badge'))
    expect(found.card).toHaveAttribute('data-badge-card')
    expect(found.straps.map(({ fixedAtStart }) => fixedAtStart)).toEqual([true, false])
    expect(found.straps[0].line.id).toBe('lanyard-left')
    expect(found.straps[1].restLine).toBe('M136 268L356 -300')
    expect(found.straps[0].stars).toEqual([0.25, 0.75])
  })

  it('finds nothing on a lid with no badge, or a lanyard with a strap missing', () => {
    fixture.sticker('badge').remove()
    expect(findHang(fixture.lid)).toBeNull()

    fixture = lidFixture()
    fixture.lid.querySelector('[data-strap="to"]')?.remove()
    expect(findHang(fixture.lid)).toBeNull()
  })
})

describe('measuring the hang', () => {
  it('reads where the straps are fixed, where they meet the clip, and the card, in the lanyard’s units', () => {
    const measured = measureHang(parts())

    expect(measured?.unitPx).toBe(1)
    expect(measured?.rig).toEqual({
      anchors: [
        { x: -96, y: -300 },
        { x: 356, y: -300 },
      ],
      ends: [
        { x: 124, y: 268 },
        { x: 136, y: 268 },
      ],
      centre: { x: 130, y: 531 },
      size: { width: 236, height: 470 },
    })
    expect(measured?.badgeAt).toEqual({ x: 0, y: 0 })
  })

  it('works in units, however large the lid is drawn, and finds a badge hung elsewhere', () => {
    placeHang(fixture.lid, { ...HANG_BOX, width: 520 })
    place(fixture.sticker('badge'), { ...HANG_BOX, left: 420, top: 120, width: 520 })
    place(parts().card, { ...CARD_BOX, left: 24, top: 592, width: 472, height: 940 })
    const measured = measureHang(parts())

    expect(measured?.unitPx).toBe(2)
    expect(measured?.badgeAt).toEqual({ x: 10, y: 10 })
    expect(measured?.rig.centre).toEqual({ x: 140, y: 541 })
    expect(measured?.rig.size).toEqual({ width: 236, height: 470 })
  })

  it('turns the card’s middle with the way the stylesheet tilts it', () => {
    parts().card.style.setProperty('rotate', '90deg')
    const measured = measureHang(parts())

    expect(measured?.rig.centre.x).toBeCloseTo(130 - 235, 6)
    expect(measured?.rig.centre.y).toBeCloseTo(296, 6)
  })

  it('measures nothing from a lanyard that is not laid out, or a strap it cannot read', () => {
    place(fixture.sticker('lanyard'), { ...HANG_BOX, width: 0 })
    expect(measureHang(parts())).toBeNull()

    fixture = lidFixture()
    fixture.lid.querySelector('#lanyard-left')?.setAttribute('d', 'M1 2Lnonsense')
    expect(measureHang(parts())).toBeNull()
  })

  it('says whether two measures hang the same, allowing for a page measured in whole px', () => {
    const measured = measureHang(parts())
    if (measured === null) {
      throw new Error('It measures')
    }
    // The page is measured in whole px, so the same hang at another scale reads a unit or so off.
    const rounded = { ...measured.rig, centre: { x: 131.4, y: 530.2 } }

    expect(sameRig(measured.rig, rounded)).toBe(true)
    expect(sameRig(measured.rig, { ...measured.rig, centre: { x: 136, y: 531 } })).toBe(false)
  })
})
