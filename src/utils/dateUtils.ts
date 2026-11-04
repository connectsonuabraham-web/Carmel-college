import { format, subDays, startOfDay, endOfDay } from 'date-fns'

/** Format a date to ISO 8601 with IST offset (+05:30), encoding + as %2B for URL usage.
 *  Converts the Date to IST (UTC+5:30) regardless of the local machine timezone. */
export function toISTParam(date: Date): string {
  // IST = UTC + 5h30m
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istDate = new Date(date.getTime() + istOffsetMs)
  const pad = (n: number) => String(n).padStart(2, '0')
  const y  = istDate.getUTCFullYear()
  const mo = pad(istDate.getUTCMonth() + 1)
  const d  = pad(istDate.getUTCDate())
  const h  = pad(istDate.getUTCHours())
  const mi = pad(istDate.getUTCMinutes())
  const s  = pad(istDate.getUTCSeconds())
  return `${y}-${mo}-${d}T${h}:${mi}:${s}%2B05:30`
}

/** Always returns a fresh range so "now" is truly now, not the time the page first loaded */
export function defaultDateRange() {
  const end   = endOfDay(new Date())
  const start = startOfDay(subDays(new Date(), 365))
  return { start, end }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm')
  } catch {
    return dateStr
  }
}

export function formatDateShort(date: Date): string {
  return format(date, 'dd MMM')
}

export function getDayLabel(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM')
  } catch {
    return dateStr
  }
}
