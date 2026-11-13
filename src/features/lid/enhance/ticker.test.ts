import { describe, expect, it } from 'vitest'

import { fakeFrames } from '../../../test/fakeClock'
import { createTicker } from './ticker'

describe('the ticker', () => {
  it('asks for no frame until it has something to do', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)

    expect(frames.pending()).toBe(0)
    expect(ticker.idle()).toBe(true)
  })

  it('runs a task every frame until the task says it has finished, then stops', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    let runs = 0

    ticker.run({ update: () => (runs += 1) < 3 })
    expect(ticker.idle()).toBe(false)
    frames.flush(10)

    expect(runs).toBe(3)
    expect(frames.pending()).toBe(0)
    expect(frames.requested()).toBe(3)
    expect(ticker.idle()).toBe(true)
  })

  it('lets every task read the page before any task writes to it', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    const order: string[] = []
    const task = (name: string) => ({
      measure: () => void order.push(`read ${name}`),
      update: () => {
        order.push(`write ${name}`)
        return false
      },
    })

    ticker.run(task('one'))
    ticker.run(task('two'))
    frames.flush(1)

    expect(order).toEqual(['read one', 'read two', 'write one', 'write two'])
  })

  it('runs a task once a frame however often it is added', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    let runs = 0
    const task = { update: () => (runs += 1) < 0 }

    ticker.run(task)
    ticker.run(task)
    frames.flush(1)

    expect(runs).toBe(1)
    expect(frames.requested()).toBe(1)
  })

  it('tells a task how long the last frame took, and never more than a stutter', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    const seen: number[] = []

    ticker.run({
      update: (dt) => {
        seen.push(dt)
        return seen.length < 3
      },
    })
    frames.step(1000)
    frames.step(1010)
    frames.step(9000)

    expect(seen[0]).toBeCloseTo(1000 / 60, 3)
    expect(seen[1]).toBe(10)
    expect(seen[2]).toBe(100)
  })

  it('starts the clock again after a rest', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    const seen: number[] = []
    const once = {
      update: (dt: number) => {
        seen.push(dt)
        return false
      },
    }

    ticker.run(once)
    frames.step(100)
    ticker.run(once)
    frames.step(5000)

    expect(seen[1]).toBeCloseTo(1000 / 60, 3)
  })

  it('drops a task that is taken away, and cancels the frame nobody needs', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    let runs = 0
    const task = { update: () => (runs += 1) > 0 }

    ticker.run(task)
    ticker.drop(task)
    frames.flush(3)

    expect(runs).toBe(0)
    expect(frames.pending()).toBe(0)
    expect(ticker.idle()).toBe(true)
  })

  it('keeps a task that is added while a frame runs for the next frame', () => {
    const frames = fakeFrames()
    const ticker = createTicker(frames)
    const order: string[] = []
    const late = {
      update: () => {
        order.push('late')
        return false
      },
    }

    ticker.run({
      update: () => {
        order.push('first')
        ticker.run(late)
        return false
      },
    })
    frames.flush(1)
    expect(order).toEqual(['first'])
    frames.flush(1)

    expect(order).toEqual(['first', 'late'])
    expect(frames.pending()).toBe(0)
  })
})
