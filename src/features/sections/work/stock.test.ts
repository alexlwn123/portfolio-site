import { describe, expect, it } from 'vitest'

import { stockFor } from './stock'

describe('stockFor', () => {
  it('prints the first tag on brushed silver, as the lid’s own asset tag is', () => {
    expect(stockFor(1, false)).toEqual({ metal: true, band: 'ink' })
  })

  it('gives neighbouring jobs different stock', () => {
    const stocks = [1, 2, 3, 4, 5, 6].map((assetNumber) => stockFor(assetNumber, false))

    stocks.slice(1).forEach((stock, index) => {
      expect(stock).not.toEqual(stocks[index])
    })
  })

  it('comes round again after the last stock', () => {
    expect(stockFor(5, false)).toEqual(stockFor(1, false))
  })

  it('prints the job still in service in highlighter, whatever its number', () => {
    expect(stockFor(1, true)).toEqual({ metal: false, band: 'hi' })
    expect(stockFor(4, true)).toEqual(stockFor(9, true))
  })

  it('never gives a past job the highlighter', () => {
    for (const assetNumber of [1, 2, 3, 4, 5, 6, 7, 8]) {
      expect(stockFor(assetNumber, false).band).not.toBe('hi')
    }
  })

  it('makes do with a number that is no asset number', () => {
    expect(stockFor(0, false)).toEqual(stockFor(1, false))
    expect(stockFor(2.7, false)).toEqual(stockFor(2, false))
  })
})
