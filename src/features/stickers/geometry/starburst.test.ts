import { describe, expect, it } from 'vitest'

import { starburstPoints, WINS_SEAL } from './starburst'

/** The polygon typed out by hand in design/mockups/01-first-screen.html. */
const MOCKUP_POINTS =
  '100.0,8.0 113.5,23.2 131.5,13.5 139.0,32.5 159.1,29.5 159.8,49.9 179.7,54.0 173.3,73.3 190.6,84.0 178.0,100.0 190.6,116.0 173.3,126.7 179.7,146.0 159.8,150.1 159.1,170.5 139.0,167.5 131.5,186.5 113.5,176.8 100.0,192.0 86.5,176.8 68.5,186.5 61.0,167.5 40.9,170.5 40.2,150.1 20.3,146.0 26.7,126.7 9.4,116.0 22.0,100.0 9.4,84.0 26.7,73.3 20.3,54.0 40.2,49.9 40.9,29.5 61.0,32.5 68.5,13.5 86.5,23.2'

describe('starburstPoints', () => {
  it('Starburst generates its points: the same polygon as the mockup', () => {
    expect(starburstPoints(WINS_SEAL)).toBe(MOCKUP_POINTS)
  })

  it('draws a tip and a notch for every spike', () => {
    const points = starburstPoints({ centre: 50, spikes: 5, outer: 40, inner: 20 }).split(' ')

    expect(points).toHaveLength(10)
    expect(points[0]).toBe('50.0,10.0')
  })
})
