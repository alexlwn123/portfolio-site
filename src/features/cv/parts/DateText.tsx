import type { ReactElement } from 'react'

import type { DateSpan, PartialDate } from '../../../content'
import {
  formatDateSpan,
  formatPartialDate,
  isoDate,
  type MonthStyle,
} from '../../../lib/formatDate'

interface DateTextProps {
  readonly date: PartialDate
  readonly month?: MonthStyle
}

/** A date as a time element, written to the precision the record has. */
export function DateText({ date, month = 'short' }: DateTextProps): ReactElement {
  return <time dateTime={isoDate(date)}>{formatPartialDate(date, month)}</time>
}

interface DateSpanTextProps {
  readonly span: DateSpan
  readonly month?: MonthStyle
}

/** A span of dates as one time element, anchored on its first day. */
export function DateSpanText({ span, month = 'short' }: DateSpanTextProps): ReactElement {
  return <time dateTime={isoDate(span.start)}>{formatDateSpan(span, month)}</time>
}
