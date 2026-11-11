/*
 * Custom properties on an element, written through the CSSOM. The markup
 * carries no style attribute, and none is left behind once the last property
 * is taken away.
 */

export function setVars(
  element: ElementCSSInlineStyle,
  vars: Readonly<Record<string, string>>,
): void {
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value)
  }
}

export function clearVars(
  element: ElementCSSInlineStyle & Element,
  names: readonly string[],
): void {
  for (const name of names) {
    element.style.removeProperty(name)
  }
  // The attribute is asked for before it is taken away. Chromium writes a style attribute that
  // was only ever set through the CSSOM late, and one removed before it is written comes back empty.
  if (element.style.length === 0 && element.hasAttribute('style')) {
    element.removeAttribute('style')
  }
}
