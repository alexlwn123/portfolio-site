import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export const DIST = resolve(import.meta.dirname, '../../dist')

/** Maps a URL path to the file a static host serves for it. */
export function fileForRoute(route: string): string {
  const relative = route.replace(/^\//, '')
  return relative === '' || relative.endsWith('/') ? `${relative}index.html` : relative
}

export async function readDistFile(relativePath: string): Promise<string> {
  try {
    return await readFile(join(DIST, relativePath), 'utf8')
  } catch (error) {
    throw new Error(`Expected the build to emit dist/${relativePath}`, { cause: error })
  }
}

export async function readPage(route: string): Promise<Document> {
  const html = await readDistFile(fileForRoute(route))
  return new DOMParser().parseFromString(html, 'text/html')
}
