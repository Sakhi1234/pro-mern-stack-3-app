import { apiFetch } from '../utils/restFetch.js';

export function fetchAbout(showError) {
  return apiFetch('/about', { method: 'GET' }, showError);
}
