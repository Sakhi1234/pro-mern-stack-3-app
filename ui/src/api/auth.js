import { apiFetch } from '../utils/restFetch.js';

export function fetchCurrentUser(showError) {
  return apiFetch('/user', { method: 'GET' }, showError);
}
