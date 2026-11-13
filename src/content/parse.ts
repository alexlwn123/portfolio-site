import { z } from 'zod'

import { deepFreeze, type DeepReadonly } from '../lib/deepFreeze'

interface Problem {
  readonly path: readonly PropertyKey[]
  readonly message: string
}

/** Writes a path the way it would be typed: `wins[2].result.place`. */
export function formatPath(root: string, path: readonly PropertyKey[]): string {
  return path.reduce<string>(
    (text, key) => (typeof key === 'number' ? `${text}[${String(key)}]` : `${text}.${String(key)}`),
    root,
  )
}

/** Thrown when a content record is invalid. The message names every bad field. */
export class ContentError extends Error {
  constructor(root: string, problems: readonly Problem[]) {
    const lines = problems.map(({ path, message }) => `  ${formatPath(root, path)}: ${message}`)
    super(`Invalid content in "${root}":\n${lines.join('\n')}`)
    this.name = 'ContentError'
  }
}

/**
 * Validates a value when its module loads and returns it frozen. A bad record
 * stops the build with an error that names the field.
 */
export function parseContent<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
  root: string,
): DeepReadonly<z.output<Schema>> {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new ContentError(root, result.error.issues)
  }
  return deepFreeze(result.data)
}

/** A list of records in which every id is used once. */
export function recordList<Schema extends z.ZodType<{ id: string }>>(
  schema: Schema,
): z.ZodArray<Schema> {
  return z.array(schema).superRefine((records, context) => {
    records.forEach((record, index) => {
      const firstIndex = records.findIndex((other) => other.id === record.id)
      if (firstIndex !== index) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: `Duplicate id "${record.id}"`,
        })
      }
    })
  })
}
