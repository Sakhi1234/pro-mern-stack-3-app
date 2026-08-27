import { apiFetch, toQuery } from '../utils/restFetch.js';

export function fetchIssueList(params, showError) {
  return apiFetch(`/issues${toQuery(params)}`, { method: 'GET' }, showError);
}

export function searchIssues(search, showError) {
  return fetchIssueList({ search }, showError);
}

export function fetchIssue(id, showError) {
  return apiFetch(`/issues/${id}`, { method: 'GET' }, showError);
}

export function createIssue(issue, showError) {
  return apiFetch(
    '/issues',
    {
      method: 'POST',
      body: JSON.stringify({ issue }),
    },
    showError,
  );
}

export function updateIssue(id, changes, showError) {
  return apiFetch(
    `/issues/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ changes }),
    },
    showError,
  );
}

export function closeIssueRequest(id, showError) {
  return updateIssue(id, { status: 'Closed' }, showError);
}

export function restoreIssueRequest(id, showError) {
  return apiFetch(`/issues/${id}/restore`, { method: 'POST' }, showError);
}

export function deleteIssueRequest(id, showError) {
  return apiFetch(`/issues/${id}`, { method: 'DELETE' }, showError);
}

export function generateIssueSummary(id, showError) {
  return apiFetch(`/issues/${id}/summary`, { method: 'POST' }, showError);
}
