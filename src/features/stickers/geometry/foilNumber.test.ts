import { describe, expect, it } from 'vitest'

import { FOIL_NUMBER, foilNumberBox } from './foilNumber'

describe('foilNumberBox', () => {
  it('is the mockup’s drawing for two digits: 270 by 196, lettered on its centre line', () => {
    expect(foilNumberBox('16')).toEqual({ width: 270, height: 196, centre: 135 })
  })

  it('grows by a digit’s width for each digit more', () => {
    expect(foilNumberBox('9').width).toBe(FOIL_NUMBER.digit)
    expect(foilNumberBox('100').width).toBe(FOIL_NUMBER.digit * 3)
    expect(foilNumberBox('100').centre).toBe((FOIL_NUMBER.digit * 3) / 2)
  })

  it('still has room for one digit when it is given nothing', () => {
    expect(foilNumberBox('').width).toBe(FOIL_NUMBER.digit)
  })
})
