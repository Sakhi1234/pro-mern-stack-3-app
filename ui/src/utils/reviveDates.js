const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

// Use the same date conversion for API responses and SSR bootstrap JSON.
export default function reviveDates(value) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, reviveDates(nested)]),
    );
  }
  if (typeof value === "string" && ISO_DATE_TIME_PATTERN.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}
