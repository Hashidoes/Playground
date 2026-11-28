import type { ISODate, Repeat, Time } from '../data/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today(): ISODate {
  return toISODate(new Date());
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function addMonths(s: ISODate, n: number): ISODate {
  const d = fromISODate(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISODate(d);
}

export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

/** Next occurrence date after `from` for a repeating task. */
export function nextOccurrence(from: ISODate, repeat: Repeat): ISODate | null {
  switch (repeat) {
    case 'daily': return addDays(from, 1);
    case 'alternate': return addDays(from, 2);
    case 'weekly': return addDays(from, 7);
    case 'fortnightly': return addDays(from, 14);
    case 'monthly': return addMonths(from, 1);
    default: return null;
  }
}

/** 7:00 am, 11:30 am, 6:40 pm */
export function formatTime(t: Time): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function timeFromDate(d: Date): Time {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Thu, 12 Dec */
export function formatShortDate(s: ISODate): string {
  const d = fromISODate(s);
  return `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** Thursday, 12 December */
export function formatLongDate(s: ISODate): string {
  const d = fromISODate(s);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function weekdayShort(s: ISODate): string {
  return DAYS[fromISODate(s).getDay()].slice(0, 3).toUpperCase();
}

export function dayOfMonth(s: ISODate): string {
  return String(fromISODate(s).getDate());
}

/** Today, Tomorrow, Yesterday, This Friday (within a week), otherwise Thu, 12 Dec. */
export function relativeDay(s: ISODate, now: ISODate = today()): string {
  const diff = daysBetween(now, s);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `This ${DAYS[fromISODate(s).getDay()]}`;
  return formatShortDate(s);
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

/** Matches the greeting table in the Copy section. */
export function dayPart(d: Date = new Date()): DayPart {
  const h = d.getHours();
  if (h >= 4 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/** Monday of the week containing `s`. Scores start fresh every Monday. */
export function startOfWeek(s: ISODate): ISODate {
  const d = fromISODate(s);
  const offset = (d.getDay() + 6) % 7;
  return addDays(s, -offset);
}

export function startOfMonth(s: ISODate): ISODate {
  return s.slice(0, 8) + '01';
}

/** Dec */
export function monthShort(s: ISODate): string {
  return MONTHS[fromISODate(s).getMonth()].slice(0, 3);
}
