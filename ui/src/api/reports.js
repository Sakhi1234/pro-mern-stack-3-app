import { apiFetch, toQuery } from '../utils/restFetch.js';

export function getReportParams(search) {
  const searchParams = new URLSearchParams(search);
  const reportParams = {};
  if (searchParams.get('status')) reportParams.status = searchParams.get('status');

  const effortMin = parseInt(searchParams.get('effortMin'), 10);
  if (!Number.isNaN(effortMin)) reportParams.effortMin = effortMin;
  const effortMax = parseInt(searchParams.get('effortMax'), 10);
  if (!Number.isNaN(effortMax)) reportParams.effortMax = effortMax;

  return reportParams;
}

export function fetchIssueCounts(params, showError, requestOptions = {}) {
  return apiFetch(
    `/issue-counts${toQuery(params)}`,
    { method: 'GET', ...requestOptions },
    showError,
  );
}

export async function fetchIssueReport(search, showError, requestOptions = {}) {
  const data = await fetchIssueCounts(getReportParams(search), showError, requestOptions);
  return data?.issueCounts || null;
}
