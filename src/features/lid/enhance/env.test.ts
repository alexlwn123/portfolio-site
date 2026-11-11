import { afterEach, describe, expect, it, vi } from 'vitest'

import { browserEnv } from './env'

interface MediaStub {
  readonly matches: boolean
  readonly addEventListener: ReturnType<typeof vi.fn>
}

/** jsdom has no matchMedia: this answers each query as the test says. */
function stubMedia(matching: readonly string[] = []): Map<string, MediaStub> {
  const asked = new Map<string, MediaStub>()
  vi.stubGlobal('matchMedia', (query: string) => {
    const media = { matches: matching.includes(query), addEventListener: vi.fn() }
    asked.set(query, media)
    return media
  })
  return asked
}

/** A constructor to stand where the browser's DeviceOrientationEvent would be. */
function orientationEvent(): () => void {
  return function DeviceOrientationEvent() {
    return undefined
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('what the browser can do', () => {
  it('reads the visitor’s wish for less motion, and whether the pointer is a finger', () => {
    stubMedia(['(prefers-reduced-motion: reduce)'])
    expect(browserEnv(window)).toMatchObject({ reducedMotion: true, touch: false })

    stubMedia(['(hover: none) and (pointer: coarse)'])
    expect(browserEnv(window)).toMatchObject({ reducedMotion: false, touch: true })
  })

  it('hands on frames and timers', () => {
    stubMedia()
    const request = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue()
    const env = browserEnv(window)
    const callback = vi.fn()

    expect(env.frames.request(callback)).toBe(7)
    env.frames.cancel(7)
    expect(request).toHaveBeenCalledWith(callback)
    expect(cancel).toHaveBeenCalledWith(7)

    vi.useFakeTimers()
    const handle = env.timers.set(callback, 200)
    env.timers.clear(handle)
    env.timers.set(callback, 200)
    vi.advanceTimersByTime(250)
    vi.useRealTimers()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('finds localStorage, and does without it where reading it throws', () => {
    stubMedia()
    expect(browserEnv(window).storage).toBe(window.localStorage)

    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    })
    expect(browserEnv(window).storage).toBeNull()
  })

  it('makes an audio context only when asked, and none where there is no Web Audio', () => {
    stubMedia()
    expect(browserEnv(window).createAudio()).toBeNull()

    const made = vi.fn()
    vi.stubGlobal('AudioContext', function AudioContext() {
      made()
    })
    const env = browserEnv(window)
    expect(made).not.toHaveBeenCalled()
    expect(env.createAudio()).not.toBeNull()
    expect(made).toHaveBeenCalledTimes(1)
  })

  it('cannot watch the screen without IntersectionObserver', () => {
    stubMedia()

    expect(browserEnv(window).onScreen).toBeNull()
  })

  it('reports each watched element as it comes on and goes off screen', () => {
    stubMedia()
    let notify: (entries: readonly { target: Element; isIntersecting: boolean }[]) => void = () =>
      undefined
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof notify, options: { rootMargin: string }) {
          notify = callback
          expect(options.rootMargin).toMatch(/px$/)
        }
        observe = observe
      },
    )
    const report = vi.fn()

    browserEnv(window).onScreen?.(report).watch(document.body)
    notify([
      { target: document.body, isIntersecting: true },
      { target: document.body, isIntersecting: false },
    ])

    expect(observe).toHaveBeenCalledWith(document.body)
    expect(report.mock.calls).toEqual([
      [document.body, true],
      [document.body, false],
    ])
  })

  it('has no orientation where the device reports none', () => {
    stubMedia()
    vi.stubGlobal('DeviceOrientationEvent', undefined)

    expect(browserEnv(window).orientation).toBeNull()
  })

  it('needs no asking where the platform has nothing to ask', async () => {
    stubMedia()
    vi.stubGlobal('DeviceOrientationEvent', orientationEvent())

    await expect(browserEnv(window).orientation?.ask()).resolves.toBe(true)
  })

  it.each([
    ['granted', true],
    ['denied', false],
  ])('asks iOS for motion, and takes "%s" for an answer', async (answer, allowed) => {
    stubMedia()
    const requestPermission = vi.fn(() => Promise.resolve(answer))
    vi.stubGlobal(
      'DeviceOrientationEvent',
      Object.assign(orientationEvent(), { requestPermission }),
    )

    await expect(browserEnv(window).orientation?.ask()).resolves.toBe(allowed)
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('passes on readings while it is listening, and stops when told', () => {
    stubMedia()
    vi.stubGlobal('DeviceOrientationEvent', orientationEvent())
    const onReading = vi.fn()
    const stop = browserEnv(window).orientation?.listen(onReading)
    const reading = Object.assign(new Event('deviceorientation'), { beta: 12, gamma: -3 })

    window.dispatchEvent(reading)
    stop?.()
    window.dispatchEvent(reading)

    expect(onReading.mock.calls).toEqual([[{ beta: 12, gamma: -3 }]])
  })

  it('reads how the screen is turned, and takes it as upright where it cannot', () => {
    stubMedia()
    vi.stubGlobal('DeviceOrientationEvent', orientationEvent())
    expect(browserEnv(window).orientation?.screenAngle()).toBe(0)

    vi.stubGlobal('screen', { orientation: { angle: 90 } })
    expect(browserEnv(window).orientation?.screenAngle()).toBe(90)
  })

  it('tells the lid when it changes between its three arrangements', () => {
    const asked = stubMedia()
    const callback = vi.fn()

    browserEnv(window).onRearrange(callback)

    for (const query of ['(max-width: 560px)', '(min-width: 1100px)']) {
      expect(asked.get(query)?.addEventListener, query).toHaveBeenCalledWith('change', callback)
    }
  })
})
