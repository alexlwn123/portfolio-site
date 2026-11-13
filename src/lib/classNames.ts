export type ClassName = string | false | null | undefined

/** Joins class names, skipping the ones a condition switched off. */
export function cx(...names: readonly ClassName[]): string {
  return names.filter((name) => typeof name === 'string' && name !== '').join(' ')
}
