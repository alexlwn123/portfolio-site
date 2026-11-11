/*
 * Custom properties on an element, written through the CSSOM. The markup
 * carries no style attribute, and none is left behind once the last property
 * is taken away.
 */

export function setVars(element: HTMLElement, vars: Readonly<Record<string, string>>): void {
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value)
  }
}

export function clearVars(element: HTMLElement, names: readonly string[]): void {
  for (const name of names) {
    element.style.removeProperty(name)
  }
  if (element.style.length === 0) {
    element.removeAttribute('style')
  }
}
