import {
  foilGlowCentre,
  foilGradientTransform,
  NAME_GLOW_FIELD,
} from '../../stickers/geometry/foil'
import { paintRef, SHARED_IDS } from '../../stickers/svgIds'
import type { Env } from './env'
import { createLightLoop, type LightLoop } from './lightLoop'
import { lampUnder, lampValue, type Point } from './lightMath'
import type { Ticker } from './ticker'

/*
 * Puts the lamp into the page. The loop's whole output is two custom
 * properties on the lid, --lamp-x and --lamp-y. The stylesheets turn those
 * into every shadow, every peeling corner's highlight and the CSS foil.
 *
 * Two things cannot be reached from a stylesheet in every browser: the vector
 * of the SVG foil's gradient and the centre of the name's glow. Those are
 * attributes, written here from the same lamp, and only while a sticker cut
 * from that foil is on screen.
 *
 * A sticker follows the lamp only while it carries data-lit, which it does
 * while it is on screen: see Sticker.module.css.
 */

interface Foil {
  /** The gradient the name and the hex badge are filled with. */
  readonly sheen: Element | null
  /** The hot spot on the name. */
  readonly glow: Element | null
  /** The stickers that are filled with either. */
  readonly stickers: readonly Element[]
}

const GLOW_ID_SUFFIX = '-glow'

function foilOf(lid: HTMLElement): Foil {
  const users = lid.querySelectorAll(`[fill="${paintRef(SHARED_IDS.foil)}"]`)
  const stickers = [...users].flatMap((user) => user.closest('[data-sticker]') ?? [])
  return {
    sheen: lid.ownerDocument.getElementById(SHARED_IDS.foil),
    glow: lid.querySelector(`radialGradient[id$="${GLOW_ID_SUFFIX}"]`),
    stickers: [...new Set(stickers)],
  }
}

function writeFoil({ sheen, glow }: Foil, lamp: Point): void {
  const { cx, cy } = foilGlowCentre(lamp, NAME_GLOW_FIELD)
  sheen?.setAttribute('gradientTransform', foilGradientTransform(lamp))
  glow?.setAttribute('cx', cx)
  glow?.setAttribute('cy', cy)
}

function writeLamp(lid: HTMLElement, { x, y }: Point): void {
  lid.style.setProperty('--lamp-x', lampValue(x))
  lid.style.setProperty('--lamp-y', lampValue(y))
}

/**
 * Starts the light. Returns its loop, or null where the lamp must not or
 * cannot move: under reduced motion, and without IntersectionObserver.
 */
export function installLight(lid: HTMLElement, env: Env, ticker: Ticker): LightLoop | null {
  if (env.reducedMotion || env.onScreen === null) {
    return null
  }
  const foil = foilOf(lid)
  let lit: readonly Element[] = []
  const foilLit = (): boolean => foil.stickers.some((sticker) => lit.includes(sticker))

  const loop = createLightLoop({
    ticker,
    timers: env.timers,
    write: (lamp) => {
      writeLamp(lid, lamp)
      if (foilLit()) {
        writeFoil(foil, lamp)
      }
    },
  })

  const screen = env.onScreen((sticker, onScreen) => {
    const wasLit = foilLit()
    lit = onScreen ? [...lit, sticker] : lit.filter((other) => other !== sticker)
    sticker.toggleAttribute('data-lit', onScreen)
    if (!wasLit && foilLit()) {
      writeFoil(foil, loop.lamp())
    }
    loop.show(lit.length > 0)
  })
  for (const sticker of lid.querySelectorAll('[data-sticker]')) {
    screen.watch(sticker)
  }

  const onMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') {
      const pointer = { x: event.clientX, y: event.clientY }
      loop.follow(lampUnder(pointer, lid.getBoundingClientRect()))
    }
  }
  lid.addEventListener('pointermove', onMove, { passive: true })
  lid.addEventListener('pointerleave', loop.drift, { passive: true })
  loop.drift()
  return loop
}
