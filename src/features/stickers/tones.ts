import styles from './tones.module.css'

/** The vinyl colours a sticker can be cut from. */
export type Tone = 'white' | 'ink' | 'tang' | 'gum' | 'hi' | 'mint'

/** The class that sets a tone's --c and --t custom properties. */
export function toneClass(tone: Tone): string | undefined {
  return styles[tone]
}
