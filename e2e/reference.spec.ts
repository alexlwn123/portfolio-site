import { expect, test } from '@playwright/test'

import { MOCKUPS, openMockup, saveScreenshot } from './mockup'

/*
 * Renders the approved mockups and saves them as the reference images in
 * design/screenshots/. The lid is compared against these (see
 * lid-visual.spec.ts), and they sit beside the lid's own screenshots for
 * review.
 */
const REFERENCES = [
  { file: MOCKUPS.firstScreen, width: 728, name: 'mockup-728.png' },
  { file: MOCKUPS.firstScreen, width: 390, name: 'mockup-390.png' },
  { file: MOCKUPS.wristbands, width: 728, name: 'mockup-wristbands-728.png' },
  { file: MOCKUPS.wristbands, width: 390, name: 'mockup-wristbands-390.png' },
] as const

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const WEB_FONTS = ['Bowlby One', 'Bricolage Grotesque', 'Permanent Marker'] as const

for (const { file, width, name } of REFERENCES) {
  test(`saves ${name}: ${file} at ${String(width)} wide`, async ({ page }) => {
    await openMockup(page, file, width)

    const loaded = await page.evaluate(
      (families) => families.filter((family) => document.fonts.check(`16px "${family}"`)),
      WEB_FONTS,
    )
    expect(loaded).toEqual(WEB_FONTS)
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)

    const image = await saveScreenshot(page, name)

    expect(image.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  })
}
