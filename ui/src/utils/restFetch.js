import axios from "axios";

const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

function isIsoDateTimeString(value) {
  return typeof value === "string" && ISO_DATE_TIME_PATTERN.test(value);
}

function toQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  });
  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
}

function reviveDates(value) {
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value && typeof value === "object") {
    const revivedValue = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      revivedValue[key] = reviveDates(nestedValue);
    });
    return revivedValue;
  }
  if (isIsoDateTimeString(value)) {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
  }
  return value;
}

export async function apiFetch(path, options = {}, showError = null) {
  const apiBase = import.meta.env.VITE_UI_API_ENDPOINT || "/api";
  try {
    const response = await axios({
      url: `${apiBase}${path}`,
      method: options.method || "GET",
      data: options.body ? JSON.parse(options.body) : undefined,
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      withCredentials: true,
    });
    // Convert API date strings back to Date objects for UI formatters.
    return reviveDates(response.data);
  } catch (error) {
    if (error.code === "ERR_CANCELED") return null;

    const payload = error?.response?.data;
    const message = payload?.details?.length
      ? `${payload.error}:\n ${payload.details.join("\n ")}`
      : payload?.error || payload?.message || error.message || "Request failed";
    if (showError) showError(message);
    return null;
  }
}

export { toQuery };
