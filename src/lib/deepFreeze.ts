type Primitive = string | number | boolean | bigint | symbol | null | undefined

/** The type of a value once every level of it is read-only. */
export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends (...args: never[]) => unknown
    ? T
    : T extends readonly (infer Item)[]
      ? readonly DeepReadonly<Item>[]
      : { readonly [Key in keyof T]: DeepReadonly<T[Key]> }

/**
 * Freezes a value and everything reachable from it, so content can be shared
 * between modules without any of them being able to change it.
 */
export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<T>
  }
  for (const child of Object.values(value)) {
    deepFreeze(child)
  }
  return Object.freeze(value) as DeepReadonly<T>
}
