/** What every drawing on the mat is given. */
export interface DrawingProps {
  /** The sticker this drawing belongs to. Any id inside it is built from this. */
  readonly id: string
  /** The project's name, over one line or two. */
  readonly lines: readonly string[]
}
