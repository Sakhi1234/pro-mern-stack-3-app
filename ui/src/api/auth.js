import { apiFetch } from '../utils/restFetch.js';

export function fetchCurrentUser(showError, requestOptions = {}) {
  return apiFetch('/user', { method: 'GET', ...requestOptions }, showError);
}
