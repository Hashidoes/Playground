import { signIn } from '../copy/strings';

/** Indian mobile numbers: 10 digits starting with 6–9. */
export function isValidMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

/** +91 98765 43210 */
export function formatPhone(digits: string): string {
  return `${signIn.countryCode} ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
