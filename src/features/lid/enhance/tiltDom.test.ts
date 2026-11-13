import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fakeEnv, fakeOrientation, lidFixture, type LidFixture } from '../../../test/lidFixture'
import type { LightLoop } from './lightLoop'
import { LAMP_REST } from './lightMath'
import { installTilt } from './tiltDom'

let fixture: LidFixture

function fakeLoop() {
  return {
    follow: vi.fn<LightLoop['follow']>(),
    drift: vi.fn<LightLoop['drift']>(),
    show: vi.fn<LightLoop['show']>(),
    lamp: () => LAMP_REST,
    running: () => false,
  }
}

/** Lets the promise behind a click on the button settle. */
async function press(button: HTMLElement): Promise<void> {
  button.click()
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(() => {
  fixture = lidFixture()
})

describe('the tilt sticker', () => {
  it('stays hidden on a device with a mouse', () => {
    installTilt(fixture.lid, fakeEnv({ orientation: fakeOrientation() }), fakeLoop())

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
  })

  it('stays hidden where the device reports no orientation', () => {
    installTilt(fixture.lid, fakeEnv({ touch: true }), fakeLoop())

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
  })

  it('stays hidden when the lamp does not move: under reduced motion there is no loop', () => {
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation: fakeOrientation() }), null)

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
  })

  it('shows on a touch device that can tell which way up it is, and asks nothing yet', () => {
    const orientation = fakeOrientation()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), fakeLoop())

    expect(fixture.control('tilt')).not.toHaveAttribute('hidden')
    expect(fixture.control('tilt')).toHaveAttribute('aria-pressed', 'false')
    expect(orientation.asked()).toBe(0)
    expect(orientation.listening()).toBe(false)
  })

  it('asks for motion when it is pressed, and then moves the lamp as the phone tilts', async () => {
    const orientation = fakeOrientation(true)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))
    orientation.send({ beta: 40, gamma: 0 })
    orientation.send({ beta: 40, gamma: 14 })

    expect(orientation.asked()).toBe(1)
    expect(fixture.control('tilt')).toHaveAttribute('aria-pressed', 'true')
    expect(loop.follow).toHaveBeenNthCalledWith(1, LAMP_REST)
    expect(loop.follow.mock.calls[1]?.[0].x).toBeGreaterThan(LAMP_REST.x)
    expect(loop.follow.mock.calls[1]?.[0].y).toBe(LAMP_REST.y)
  })

  it('hides for good when the request is refused, and nothing breaks', async () => {
    const orientation = fakeOrientation(false)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
    expect(orientation.listening()).toBe(false)
    expect(loop.follow).not.toHaveBeenCalled()
  })

  it('hides when asking throws', async () => {
    const orientation = fakeOrientation(new Error('Requires a user gesture'))
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), fakeLoop())

    await press(fixture.control('tilt'))

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
    expect(orientation.listening()).toBe(false)
  })

  it('hides when the first reading shows there is no sensor behind the event', async () => {
    const orientation = fakeOrientation(true)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))
    orientation.send({ beta: null, gamma: null })

    expect(fixture.control('tilt')).toHaveAttribute('hidden')
    expect(orientation.listening()).toBe(false)
    expect(loop.drift).toHaveBeenCalledTimes(1)
  })

  it('takes a new baseline when the tab comes back', async () => {
    const orientation = fakeOrientation(true)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))
    orientation.send({ beta: 40, gamma: 0 })
    orientation.send({ beta: 40, gamma: 20 })
    document.dispatchEvent(new Event('visibilitychange'))
    orientation.send({ beta: 5, gamma: -30 })

    expect(document.visibilityState).toBe('visible')
    expect(loop.follow).toHaveBeenLastCalledWith(LAMP_REST)
  })

  it('reads the phone the way its screen is turned', async () => {
    const orientation = fakeOrientation(true, 90)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))
    orientation.send({ beta: 0, gamma: 0 })
    orientation.send({ beta: 14, gamma: 0 })

    expect(loop.follow.mock.calls[1]?.[0].x).toBeGreaterThan(LAMP_REST.x)
  })

  it('lets go of the lamp when it is pressed again', async () => {
    const orientation = fakeOrientation(true)
    const loop = fakeLoop()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), loop)

    await press(fixture.control('tilt'))
    await press(fixture.control('tilt'))

    expect(fixture.control('tilt')).toHaveAttribute('aria-pressed', 'false')
    expect(fixture.control('tilt')).not.toHaveAttribute('hidden')
    expect(orientation.listening()).toBe(false)
    expect(loop.drift).toHaveBeenCalledTimes(1)
    expect(orientation.asked()).toBe(1)
  })

  it('leans the badge with the phone, in radians, and levels it when it lets go', async () => {
    const orientation = fakeOrientation(true)
    const onLean = vi.fn<(radians: number) => void>()
    installTilt(fixture.lid, fakeEnv({ touch: true, orientation }), fakeLoop(), { onLean })

    await press(fixture.control('tilt'))
    orientation.send({ beta: 40, gamma: 0 })
    orientation.send({ beta: 40, gamma: 18 })
    await press(fixture.control('tilt'))

    expect(onLean.mock.calls.map(([radians]) => radians)).toEqual([0, (18 * Math.PI) / 180, 0])
  })

  it('does nothing on a lid that has no tilt sticker', () => {
    fixture.control('tilt').remove()

    expect(() => {
      installTilt(fixture.lid, fakeEnv({ touch: true, orientation: fakeOrientation() }), fakeLoop())
    }).not.toThrow()
  })
})
