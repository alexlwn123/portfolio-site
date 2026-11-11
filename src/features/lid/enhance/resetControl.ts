/*
 * The "tidy the lid" sticker: a button that puts everything back. What that
 * means is up to whoever installs it, which hands it the things to undo.
 */
export function installReset(lid: HTMLElement, actions: readonly (() => void)[]): void {
  const button = lid.querySelector<HTMLElement>('[data-control="tidy"]')
  if (!button) {
    return
  }
  button.addEventListener('click', () => {
    for (const action of actions) {
      action()
    }
  })
  button.removeAttribute('hidden')
}
