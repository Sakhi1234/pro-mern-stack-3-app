import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { matchRoutes, StaticRouter } from "react-router-dom";
import createEmotionServer from "@emotion/server/create-instance";
import App from "./App.jsx";
import AppProviders from "./AppProviders.jsx";
import createEmotionCache from "./createEmotionCache.js";
import reviveDates from "./utils/reviveDates.js";
import routes from "./routes/routes.js";
import Page from "./layouts/Page.jsx";
import { createApiReader } from "./utils/ssrApi.js";

export async function render(url, { apiOrigin, cookie = "", fetcher = fetch }) {
  const location = new URL(url, "http://ui.local");
  const { route, params } = matchRoutes(routes, location.pathname).at(-1);
  if (route.redirectTo) {
    return { redirectTo: route.redirectTo, status: 301 };
  }

  // Every page loader receives the same request-scoped API reader and URL.
  // Load the shared layout's user once, in parallel with the page's data.
  const context = {
    get: createApiReader(apiOrigin, cookie, fetcher),
    url: location,
    params,
  };
  const [pageData, user] = await Promise.all([
    route.component.fetchData?.(context) ?? {},
    Page.fetchData(context),
  ]);
  const initialData = {
    ...pageData,
    route: `${location.pathname}${location.search}`,
    user,
    status: pageData.status ?? 200,
  };

  // Both the style cache and bootstrap data belong to this request only.
  const cache = createEmotionCache();
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);
  const html = renderToString(
    <StrictMode>
      <AppProviders cache={cache}>
        <StaticRouter location={url}>
          <App initialData={reviveDates(initialData)} />
        </StaticRouter>
      </AppProviders>
    </StrictMode>,
  );
  return {
    html,
    styles: constructStyleTagsFromChunks(extractCriticalToChunks(html)),
    initialData,
    status: initialData.status,
  };
}
