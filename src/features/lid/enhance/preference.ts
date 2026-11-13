/*
 * Whether the visitor wants sound, remembered between visits. What comes out
 * of localStorage is whatever any script or person put there, so it is
 * checked field by field before it is believed. (The content is validated
 * with zod at build time. zod is kept out of the browser, so this is by hand.)
 */

export interface SoundPreference {
  readonly on: boolean
  /** Whether reduced motion was asked for when the choice was made. */
  readonly reducedMotion: boolean
}

/** The parts of the Storage interface this needs. */
export interface PreferenceStorage {
  readonly getItem: (name: string) => string | null
  readonly setItem: (name: string, value: string) => void
}

export const STORAGE_KEY = 'lid:sound'

const VERSION = 1
const FIELDS: readonly string[] = ['v', 'on', 'reduced']

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/** Reads a stored value. Anything but exactly what serializePreference writes is null. */
export function parsePreference(raw: unknown): SoundPreference | null {
  const value = typeof raw === 'string' ? parseJson(raw) : null
  if (!isRecord(value)) {
    return null
  }
  const keys = Object.keys(value)
  const { v, on, reduced } = value
  const known = keys.length === FIELDS.length && keys.every((name) => FIELDS.includes(name))
  if (!known || v !== VERSION || typeof on !== 'boolean' || typeof reduced !== 'boolean') {
    return null
  }
  return { on, reducedMotion: reduced }
}

export function serializePreference({ on, reducedMotion }: SoundPreference): string {
  return JSON.stringify({ v: VERSION, on, reduced: reducedMotion })
}

/** The stored choice, or null when there is none, it is malformed or storage is closed. */
export function readPreference(storage: PreferenceStorage | null): SoundPreference | null {
  try {
    return storage === null ? null : parsePreference(storage.getItem(STORAGE_KEY))
  } catch {
    // Storage throws in private windows and when cookies are blocked. Sound stays off.
    return null
  }
}

/** Stores the choice. False when it could not be stored, which is not an error. */
export function writePreference(
  storage: PreferenceStorage | null,
  preference: SoundPreference,
): boolean {
  try {
    storage?.setItem(STORAGE_KEY, serializePreference(preference))
    return storage !== null
  } catch {
    // Full or closed storage: the choice lasts for this visit only.
    return false
  }
}

/**
 * Whether sound should be on. It is off until asked for. Under reduced motion
 * it stays off unless the visitor turned it on while reduced motion was
 * already set: a choice made before that says nothing about what they want now.
 */
export function soundWanted(preference: SoundPreference | null, reducedMotion: boolean): boolean {
  if (!preference?.on) {
    return false
  }
  return !reducedMotion || preference.reducedMotion
}
