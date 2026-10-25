import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a timestamp coming from the backend.
 *
 * Laravel stores dates in UTC and the API often returns them without an offset
 * (for example "2026-10-25 09:34:32"). Browsers would treat such a string as
 * local time, so append "Z" when no timezone is present. Strings that already
 * carry an offset (ISO 8601) are returned as-is.
 */
export function parseServerDate(value: string): Date {
  const trimmed = value.trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    return new Date(trimmed);
  }

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const withTime = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00`
    : normalized;

  return new Date(`${withTime}Z`);
}
