/*
 * The hex badge, in the units of its 180 by 204 drawing. The outline and
 * keyline are the mockup's. The lettering sits 6 units higher than the
 * mockup's and the bolt is a tenth smaller, which makes room for a foot line
 * at 11 units instead of 9.5: on a phone that line was 6.5px tall.
 */
export const HEX = Object.freeze({
  outline: '90,8 170,54 170,150 90,196 10,150 10,54',
  keyline: '90,22 158,61 158,143 90,182 22,143 22,61',
  bolt: 'M96.3 28L73.8 62.2h13.5l-5.4 19.8 24.3-33.3H91.8z',
  /** Every line of lettering is centred on this x. */
  centreX: 90,
  kicker: Object.freeze({ y: 100, size: 11.5 }),
  /** The title's first baseline, and the distance from one line to the next. */
  title: Object.freeze({ y: 120, pitch: 19, size: 18 }),
  /** The foot line sits this far under the title's last line. */
  foot: Object.freeze({ gap: 16, size: 11 }),
})
