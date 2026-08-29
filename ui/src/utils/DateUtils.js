const DATE_INPUT_TEXT_PATTERN = /^[\d-]*$/;

export function isDateInputText(value) {
  return DATE_INPUT_TEXT_PATTERN.test(value);
}

export function formatDateForDisplay(date) {
  return date != null ? date.toDateString() : "";
}

export function formatDateForInput(date) {
  return date != null ? date.toISOString().slice(0, 10) : "";
}

export function parseDateInput(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function formatDateTimeForDisplay(date) {
  if (date == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
