/*
 * One requestAnimationFrame loop for everything on the lid that moves, which
 * runs only while something does. Each frame every task reads what it needs
 * from the page before any task writes to it, so no frame lays the page out
 * twice.
 */

/** The browser's frame clock, or a test's. */
export interface Frames {
  readonly request: (callback: (timeMs: number) => void) => number
  readonly cancel: (handle: number) => void
}

/** The browser's timers, or a test's. */
export interface Timers {
  readonly set: (callback: () => void, delayMs: number) => number
  readonly clear: (handle: number) => void
}

export interface Task {
  /** Reads from the page. Runs before any task's update. */
  readonly measure?: () => void
  /** Writes to the page. Returns false when the task has nothing more to do. */
  readonly update: (dtMs: number, nowMs: number) => boolean
}

export interface Ticker {
  /** Runs a task every frame until it finishes. Adding it twice changes nothing. */
  readonly run: (task: Task) => void
  /** Takes a task away before it has finished. */
  readonly drop: (task: Task) => void
  /** True when no frame is wanted. */
  readonly idle: () => boolean
}

const SECOND_MS = 1000
const FRAMES_PER_SECOND = 60
/** What a frame is taken to last when there is no frame before it to measure from. */
const NOMINAL_FRAME_MS = SECOND_MS / FRAMES_PER_SECOND
/** A stutter, or a tab coming back, never counts for more than this. */
const MAX_FRAME_MS = 100

export function createTicker(frames: Frames): Ticker {
  let tasks: readonly Task[] = []
  let pending: number | null = null
  let previous: number | null = null

  const frame = (nowMs: number): void => {
    const due = tasks
    const dtMs = previous === null ? NOMINAL_FRAME_MS : clampFrame(nowMs - previous)
    pending = null
    previous = nowMs
    for (const task of due) {
      task.measure?.()
    }
    const finished = due.filter((task) => !task.update(dtMs, nowMs))
    tasks = tasks.filter((task) => !finished.includes(task))
    schedule()
  }

  const schedule = (): void => {
    if (tasks.length === 0) {
      previous = null
      return
    }
    pending ??= frames.request(frame)
  }

  return {
    run: (task) => {
      if (!tasks.includes(task)) {
        tasks = [...tasks, task]
      }
      schedule()
    },
    drop: (task) => {
      tasks = tasks.filter((other) => other !== task)
      if (tasks.length === 0 && pending !== null) {
        frames.cancel(pending)
        pending = null
        previous = null
      }
    },
    idle: () => tasks.length === 0,
  }
}

function clampFrame(elapsedMs: number): number {
  return Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS)
}
