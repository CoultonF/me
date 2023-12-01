import { format, formatISO } from 'date-fns';
import { z } from 'zod';

/**
 * zDate: convert a ISO date (dt) string to a timezone corrected Date object.
 * Suitable for bringing API date strings into a date object in JS.
 */
export const zDate = z.coerce.date().transform((v) => {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  if (v instanceof Date) return new Date(v.getTime() + tz * 60000);
  return null;
});

/**
 * zDateTime: convert a ISO 8601 string to a date object in JS.
 * Suitable for bringing API ISO 8601 strings into a date object in JS.
 */
export const zDateTime = z.coerce.date();

/**
 * zIsoDate: convert a date to an ISO date (dt) string.
 * Suitable for sending date objects from JS to API as date strings like yyyy-mm-dd.
 */
export const zIsoDate = z.union([z.date(), z.string().regex(/^\d{4}-\d{2}-\d{2}.*/)]).transform((v) => {
  if (v instanceof Date) return format(v, 'yyyy-MM-dd');
  return String(v);
});

/**
 * zIsoDateTime: convert a datetime object to a ISO string with datetime and TZ info.
 * Suitable for sending datetime objects from JS to API as ISO 8601 strings.
 */
export const zIsoDateTime = z.union([z.date(), z.string().datetime({ offset: true })]).transform((v) => {
  if (v instanceof Date) return formatISO(v);
  return v;
});