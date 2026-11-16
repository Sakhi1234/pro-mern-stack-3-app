// A fresh reader is created for each SSR request; cookies are never shared.
export function createApiReader(apiOrigin, cookie = "", fetcher = fetch) {
  const headers = cookie ? { cookie } : {};
  return async function get(path) {
    const response = await fetcher(new URL(path, apiOrigin), {
      headers,
      signal: AbortSignal.timeout(5000),
      redirect: "error",
    });
    if (!response.ok) {
      const error = new Error(
        `SSR API request failed: ${path} (${response.status})`,
      );
      error.status = response.status;
      throw error;
    }
    return response.json();
  };
}

// Detail and edit pages share issue validation and missing-issue handling.
export async function loadIssue(get, id) {
  const validId =
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
  const data = validId
    ? await get(`/api/issues/${Number(id)}`).catch((error) => {
        if (error.status === 404) return { issue: null };
        throw error;
      })
    : { issue: null };
  if (
    !Object.hasOwn(data, "issue") ||
    (data.issue !== null &&
      (!Number.isSafeInteger(data.issue.id) || data.issue.id !== Number(id)))
  ) {
    throw new Error("Invalid SSR API response");
  }
  return { ...data, status: data.issue ? 200 : 404 };
}
