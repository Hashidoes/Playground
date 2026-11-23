// Sunrise and sunset in Indian Standard Time, which decide Sunlit and Evening.
//
// India has one time zone but sunrise varies by about two hours from west to east.
// Without asking for location, we use the point IST is defined by: the 82.5°E meridian
// near Mirzapur. Solar position follows the NOAA "General Solar Position" equations,
// which are accurate to within a minute or two.

/** Mirzapur, on the IST reference meridian. */
export const IST_REFERENCE = { latitude: 25.15, longitude: 82.58 } as const;

/** IST is UTC+5:30 all year (no daylight saving). */
export const IST_OFFSET_MINUTES = 330;

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export type SunTimes = {
  /** Minutes after midnight IST. */
  sunrise: number;
  sunset: number;
};

/** Day of the year (1–366) for a calendar date. */
function dayOfYear(year: number, month: number, day: number): number {
  return Math.round((Date.UTC(year, month, day) - Date.UTC(year, 0, 0)) / 86_400_000);
}

/** Sunrise and sunset for one IST calendar date, in minutes after midnight IST. */
export function sunTimes(year: number, month: number, day: number, place = IST_REFERENCE): SunTimes {
  const n = dayOfYear(year, month, day);
  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const g = ((2 * Math.PI) / daysInYear) * (n - 1); // fractional year at noon is close enough
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const lat = rad(place.latitude);
  // 90.833° accounts for atmospheric refraction and the size of the sun's disc.
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl);
  const ha = deg(Math.acos(Math.max(-1, Math.min(1, cosHa))));
  const sunriseUtc = 720 - 4 * (place.longitude + ha) - eqTime;
  const sunsetUtc = 720 - 4 * (place.longitude - ha) - eqTime;
  return { sunrise: sunriseUtc + IST_OFFSET_MINUTES, sunset: sunsetUtc + IST_OFFSET_MINUTES };
}

/** The current IST date and minutes after midnight, whatever time zone the phone is in. */
export function nowInIst(now: number = Date.now()) {
  const ist = new Date(now + IST_OFFSET_MINUTES * 60_000);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    minutes: ist.getUTCHours() * 60 + ist.getUTCMinutes() + ist.getUTCSeconds() / 60,
  };
}

export type SunState = {
  isDay: boolean;
  sunrise: number;
  sunset: number;
  /** Epoch milliseconds of the next sunrise or sunset. */
  nextChange: number;
};

/** Whether the sun is up in IST right now, and when that next changes. */
export function sunState(now: number = Date.now()): SunState {
  const t = nowInIst(now);
  const { sunrise, sunset } = sunTimes(t.year, t.month, t.day);
  const isDay = t.minutes >= sunrise && t.minutes < sunset;
  let minutesToChange: number;
  if (isDay) minutesToChange = sunset - t.minutes;
  else if (t.minutes < sunrise) minutesToChange = sunrise - t.minutes;
  else {
    // After sunset: next change is tomorrow's sunrise.
    const tomorrow = nowInIst(now + 86_400_000);
    minutesToChange = 1440 - t.minutes + sunTimes(tomorrow.year, tomorrow.month, tomorrow.day).sunrise;
  }
  return { isDay, sunrise, sunset, nextChange: now + Math.max(1, minutesToChange) * 60_000 };
}

/** 6:12 am */
export function formatMinutes(m: number): string {
  const total = Math.round(m);
  const h = Math.floor(total / 60) % 24;
  const min = total % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
