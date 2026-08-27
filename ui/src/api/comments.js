import { apiFetch } from '../utils/restFetch.js';

export function addIssueComment(issueId, comment, showError) {
  return apiFetch(
    `/issues/${issueId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ comment }),
    },
    showError,
  );
}

export function updateIssueComment(issueId, commentId, comment, showError) {
  return apiFetch(
    `/issues/${issueId}/comments/${commentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    },
    showError,
  );
}

export function deleteIssueComment(issueId, commentId, showError) {
  return apiFetch(
    `/issues/${issueId}/comments/${commentId}`,
    { method: 'DELETE' },
    showError,
  );
}
