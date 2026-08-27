import { apiFetch, toQuery } from '../utils/restFetch.js';

export function fetchIssueCounts(params, showError) {
  return apiFetch(`/issue-counts${toQuery(params)}`, { method: 'GET' }, showError);
}
