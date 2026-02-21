/**
 * Client phone: Morocco format +212XXXXXXXXX (9 digits after +212).
 * Accepts input with spaces/dashes and normalizes to +212XXXXXXXXX.
 */
const PHONE_REGEX = /^\+212[0-9]{9}$/;
const PHONE_DIGITS_ONLY = /[0-9]/g;

export function normalizePhone(input: string): string {
  const digits = (input || '').replace(/\s+/g, '').match(PHONE_DIGITS_ONLY)?.join('') ?? '';
  if (digits.length === 9) return '+212' + digits;
  if (digits.length === 10 && digits.startsWith('0')) return '+212' + digits.slice(1);
  if (digits.length === 12 && digits.startsWith('212')) return '+' + digits;
  return input.trim();
}

export function isValidPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return true; // optional
  return PHONE_REGEX.test(normalizePhone(phone));
}

export function getPhoneError(phone: string): string | null {
  if (!phone || !phone.trim()) return null;
  const normalized = normalizePhone(phone);
  if (!PHONE_REGEX.test(normalized)) return 'Phone must be +212 followed by 9 digits (e.g. +212612345678)';
  return null;
}

/** Email: standard format (unique in DB is enforced separately). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true; // optional
  return EMAIL_REGEX.test(email.trim());
}

export function getEmailError(email: string): string | null {
  if (!email || !email.trim()) return null;
  if (!EMAIL_REGEX.test(email.trim())) return 'Enter a valid email address';
  return null;
}

/** Format phone for display (already stored as +212XXXXXXXXX). */
export function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return '';
  if (PHONE_REGEX.test(phone)) return phone; // already correct
  return phone;
}
