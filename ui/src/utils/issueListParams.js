// Shared by browser requests and the server loader.
export function getIssueListParams(search, routeId) {
  const searchParams = new URLSearchParams(search);
  const listParams = {};
  if (searchParams.get("status"))
    listParams.status = searchParams.get("status");

  const effortMin = parseInt(searchParams.get("effortMin"), 10);
  if (!Number.isNaN(effortMin)) listParams.effortMin = effortMin;
  const effortMax = parseInt(searchParams.get("effortMax"), 10);
  if (!Number.isNaN(effortMax)) listParams.effortMax = effortMax;

  const selectedIssueId = parseInt(routeId, 10);
  if (!Number.isNaN(selectedIssueId)) listParams.selectedId = selectedIssueId;

  let page = parseInt(searchParams.get("page"), 10);
  if (Number.isNaN(page)) page = 1;
  listParams.page = page;
  return listParams;
}
