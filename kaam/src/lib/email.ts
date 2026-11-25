/** A practical check: something@something.something, no spaces. The real test is the code arriving. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
