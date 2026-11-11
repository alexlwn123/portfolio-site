const LOCALE = 'en-US'

const grouped = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const dollars = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const ordinalRules = new Intl.PluralRules(LOCALE, { type: 'ordinal' })

const MILLION = 1_000_000
const MILLIONS_DECIMALS = 3
const inMillions = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: MILLIONS_DECIMALS })

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

/** 2500000 becomes "2.5" and 17542000 "17.542": the caller adds "million" or "M". */
export function formatMillions(value: number): string {
  return inMillions.format(value / MILLION)
}

/** 1 becomes "1st", 2 "2nd", 11 "11th". */
export function ordinal(value: number): string {
  return `${String(value)}${ORDINAL_SUFFIX[ordinalRules.select(value)]}`
}
