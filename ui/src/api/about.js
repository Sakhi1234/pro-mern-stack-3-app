import { apiFetch } from "../utils/restFetch.js";

export function fetchAbout(showError, requestOptions = {}) {
  return apiFetch("/about", { method: "GET", ...requestOptions }, showError);
}
