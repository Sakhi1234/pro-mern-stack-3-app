const DATE_INPUT_TEXT_PATTERN = /^[\d-]*$/;
const dateFormatters = new Map();

export function isDateInputText(value) {
  return DATE_INPUT_TEXT_PATTERN.test(value);
}

export function formatDateForDisplay(date, timeZone = "UTC") {
  return formatIssueDateForDisplay(date, timeZone);
}

// UTC is the stable SSR default; timestamps pass the viewer's zone after hydration.
export function formatIssueDateForDisplay(date, timeZone = "UTC") {
  if (date == null) return "";
  if (!dateFormatters.has(timeZone)) {
    dateFormatters.set(
      timeZone,
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    );
  }
  const parts = Object.fromEntries(
    dateFormatters
      .get(timeZone)
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.weekday} ${parts.month} ${parts.day} ${parts.year}`;
}

// Due dates are calendar dates: preserve the yyyy-mm-dd entered by the user.
export function formatDateForInput(date) {
  return date != null ? date.toISOString().slice(0, 10) : "";
}

export function parseDateInput(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Represent a viewer's calendar day as midnight UTC for the existing API.
export function addCalendarDays(date, days, timeZone = "UTC") {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  const result = new Date(0);
  result.setUTCFullYear(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day) + days,
  );
  return result;
}

export function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function formatDateTimeForDisplay(date, timeZone = "UTC") {
  if (date == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}
