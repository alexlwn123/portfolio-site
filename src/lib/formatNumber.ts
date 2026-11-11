const LOCALE = 'en-US'

const grouped = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const dollars = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const ordinalRules = new Intl.PluralRules(LOCALE, { type: 'ordinal' })

const ORDINAL_SUFFIX: Readonly<Record<Intl.LDMLPluralRule, string>> = Object.freeze({
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
})

/** 1471 becomes "1,471". */
export function formatNumber(value: number): string {
  return grouped.format(value)
}

/** 163525 becomes "$163,525". */
export function formatUsd(amount: number): string {
  return dollars.format(amount)
}

/** 1 becomes "1st", 2 "2nd", 11 "11th". */
export function ordinal(value: number): string {
  return `${String(value)}${ORDINAL_SUFFIX[ordinalRules.select(value)]}`
}
