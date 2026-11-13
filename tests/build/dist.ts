import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

export const DIST = resolve(import.meta.dirname, '../../dist')

/** Maps a URL path to the file a static host serves for it. */
export function fileForRoute(route: string): string {
  const path = route.replace(/^\//, '')
  return path === '' || path.endsWith('/') ? `${path}index.html` : path
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

/** Every file in dist, as paths relative to it. */
export async function listDistFiles(): Promise<readonly string[]> {
  const entries = await readdir(DIST, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(DIST, join(entry.parentPath, entry.name)))
    .toSorted()
}

/** Scripts that a browser would run: everything except JSON-LD data blocks. */
export function executableScripts(page: Document): readonly HTMLScriptElement[] {
  return [...page.querySelectorAll('script')].filter(
    (script) => script.type !== 'application/ld+json',
  )
}
