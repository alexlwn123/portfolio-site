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

  it('cannot watch for things coming into view without IntersectionObserver', () => {
    stubMedia()

    expect(browserEnv(window).onSight).toBeNull()
  })

  describe('watching for things coming into view', () => {
    interface Entry {
      readonly target: Element
      readonly isIntersecting: boolean
      readonly intersectionRatio: number
      readonly intersectionRect: { readonly height: number }
      readonly rootBounds: { readonly height: number } | null
      readonly boundingClientRect: { readonly left: number; readonly top: number }
    }
    const SCREEN = { height: 800 }

    function entry(target: Element, ratio: number, shown: number, at = { left: 0, top: 0 }): Entry {
      return {
        target,
        isIntersecting: ratio > 0 || shown > 0,
        intersectionRatio: ratio,
        intersectionRect: { height: shown },
        rootBounds: SCREEN,
        boundingClientRect: at,
      }
    }

    function stubObserver() {
      let notify: (entries: readonly Entry[]) => void = () => undefined
      const [observe, unobserve] = [vi.fn(), vi.fn()]
      const options = vi.fn()
      vi.stubGlobal(
        'IntersectionObserver',
        class {
          constructor(callback: typeof notify, given: unknown) {
            notify = callback
            options(given)
          }
          observe = observe
          unobserve = unobserve
        },
      )
      return {
        send: (entries: readonly Entry[]) => {
          notify(entries)
        },
        observe,
        unobserve,
        options,
      }
    }

    it('reports a batch at a time, with where each thing is, until it is forgotten', () => {
      stubMedia()
      const observer = stubObserver()
      const report = vi.fn()
      const [one, other] = [document.body, document.documentElement]

      const watch = browserEnv(window).onSight?.(report)
      watch?.watch(one)
      observer.send([
        entry(one, 1, 120, { left: 12, top: 340 }),
        entry(other, 0, 0, { left: 0, top: 2000 }),
      ])
      watch?.forget(one)

      expect(observer.observe).toHaveBeenCalledWith(one)
      expect(observer.unobserve).toHaveBeenCalledWith(one)
      expect(report.mock.calls).toEqual([
        [
          [
            { element: one, showing: true, onScreen: true, left: 12, top: 340 },
            { element: other, showing: false, onScreen: false, left: 0, top: 2000 },
          ],
        ],
      ])
    })

    it('measures against the whole screen, and is told as a thing comes further into it', () => {
      stubMedia()
      const observer = stubObserver()

      browserEnv(window).onSight?.(vi.fn())

      const [given] = observer.options.mock.calls[0] as [
        { rootMargin?: string; threshold: number[] },
      ]
      // No margin: something at the very foot of the page must still be able to count as seen.
      expect(given.rootMargin).toBeUndefined()
      expect(given.threshold[0]).toBe(0)
      expect(given.threshold).toContain(0.25)
      expect(given.threshold).toEqual(given.threshold.toSorted((one, other) => one - other))
    })

    it.each([
      ['a quarter of it shows', 0.25, 30, true],
      ['less than a quarter of it shows', 0.2, 30, false],
      ['it is taller than the screen and a fifth of the screen is full of it', 0.05, 160, true],
      ['it is taller than the screen and only an edge of it shows', 0.05, 100, false],
      ['none of it shows', 0, 0, false],
    ])('counts a thing as on screen when %s', (_, ratio, shown, onScreen) => {
      stubMedia()
      const observer = stubObserver()
      const report = vi.fn<(seen: readonly { showing: boolean; onScreen: boolean }[]) => void>()

      browserEnv(window).onSight?.(report)
      observer.send([entry(document.body, ratio, shown)])

      expect(report.mock.calls[0]?.[0][0]).toMatchObject({ showing: shown > 0, onScreen })
    })

    it('takes the window’s height where the browser does not say how tall the screen is', () => {
      stubMedia()
      const observer = stubObserver()
      const report = vi.fn<(seen: readonly { onScreen: boolean }[]) => void>()
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500)

      browserEnv(window).onSight?.(report)
      observer.send([{ ...entry(document.body, 0.05, 100), rootBounds: null }])

      expect(report.mock.calls[0]?.[0][0]).toMatchObject({ onScreen: true })
    })
  })

  it('tells the time by the clock the frames keep', () => {
    stubMedia()
    vi.spyOn(window.performance, 'now').mockReturnValue(1234.5)

    expect(browserEnv(window).now()).toBe(1234.5)
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
