import { apiFetch, toQuery } from "../utils/restFetch.js";
import { getReportParams } from "../utils/reportParams.js";

export { getReportParams };

export function fetchIssueCounts(params, showError, requestOptions = {}) {
  return apiFetch(
    `/issue-counts${toQuery(params)}`,
    { method: "GET", ...requestOptions },
    showError,
  );
}

export async function fetchIssueReport(search, showError, requestOptions = {}) {
  const data = await fetchIssueCounts(
    getReportParams(search),
    showError,
    requestOptions,
  );
  return data?.issueCounts || null;
}
