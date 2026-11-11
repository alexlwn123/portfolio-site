/* Points, sizes and the little arithmetic the lid's motion is written in. */

export interface Point {
  readonly x: number
  readonly y: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

/** A box on the screen, as getBoundingClientRect gives it. */
export interface Rect extends Size {
  readonly left: number
  readonly top: number
}

export const ZERO: Point = Object.freeze({ x: 0, y: 0 })

const HALF_TURN_DEG = 180

export function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high)
}

export function add(one: Point, other: Point): Point {
  return { x: one.x + other.x, y: one.y + other.y }
}

export function subtract(one: Point, other: Point): Point {
  return { x: one.x - other.x, y: one.y - other.y }
}

export function scale(point: Point, by: number): Point {
  return { x: point.x * by, y: point.y * by }
}

export function length(point: Point): number {
  return Math.hypot(point.x, point.y)
}

/** Part of the way from one point to another: 0 is the first, 1 the second. */
export function mix(one: Point, other: Point, share: number): Point {
  return add(one, scale(subtract(other, one), share))
}

/** Turns a point about the origin, clockwise on a screen, by an angle in degrees. */
export function rotate(point: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / HALF_TURN_DEG
  const [cos, sin] = [Math.cos(radians), Math.sin(radians)]
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos }
}
