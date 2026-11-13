import { beforeEach, describe, expect, it, vi } from 'vitest'

import { lidFixture, type LidFixture } from '../../../test/lidFixture'
import { installReset } from './resetControl'

let fixture: LidFixture

beforeEach(() => {
  fixture = lidFixture()
})

describe('the tidy sticker', () => {
  it('appears once there is something for it to do', () => {
    installReset(fixture.lid, [])

    expect(fixture.control('tidy')).not.toHaveAttribute('hidden')
    expect(fixture.control('tidy').tagName).toBe('BUTTON')
  })

  it('puts everything back when pressed: each thing it was given, in order', () => {
    const order: string[] = []
    const tidy = vi.fn(() => void order.push('stickers'))
    const close = vi.fn(() => void order.push('notes'))
    installReset(fixture.lid, [tidy, close])

    fixture.control('tidy').click()
    fixture.control('tidy').click()

    expect(tidy).toHaveBeenCalledTimes(2)
    expect(order).toEqual(['stickers', 'notes', 'stickers', 'notes'])
  })

  it('does nothing on a lid without one', () => {
    fixture.control('tidy').remove()

    expect(() => {
      installReset(fixture.lid, [])
    }).not.toThrow()
  })
})
