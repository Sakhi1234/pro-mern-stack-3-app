import { getIssueListParams } from "./issueListParams.js";

export function getReportParams(search) {
  const params = getIssueListParams(search);
  delete params.page;
  return params;
}
