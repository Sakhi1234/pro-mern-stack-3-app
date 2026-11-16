import { readFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { pipeline } from "node:stream";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import express from "express";
import { renderDocument } from "./renderDocument.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const { values } = parseArgs({
  options: {
    production: { type: "boolean", default: false },
    port: { type: "string" },
    host: { type: "string", default: "localhost" },
  },
});
const production = values.production;
// External React/MUI packages must select the same production variants as Vite's client build.
if (production) process.env.NODE_ENV = "production";
const port = Number(
  values.port || process.env.UI_PORT || (production ? 4173 : 9000),
);
const apiOrigin = new URL(
  process.env.UI_SERVER_API_ORIGIN || "http://localhost:3000",
);
if (!["http:", "https:"].includes(apiOrigin.protocol))
  throw new Error("Invalid API origin");
const app = express();
app.disable("x-powered-by");

// Keep API/auth same-origin in development and production preview.
app.use(["/api", "/auth"], (req, res) => {
  const target = new URL(req.originalUrl, apiOrigin);
  const transport = target.protocol === "https:" ? https : http;
  const upstream = transport.request(
    target,
    {
      method: req.method,
      headers: { ...req.headers, host: target.host },
      timeout: 30000,
    },
    (response) => {
      res.writeHead(response.statusCode, response.headers);
      // Forward stream failures too: a truncated API response must close the
      // browser response rather than leaving it waiting for a missing body.
      pipeline(response, res, (error) => {
        if (error) upstream.destroy();
      });
    },
  );
  upstream.on("timeout", () =>
    upstream.destroy(new Error("API proxy timed out")),
  );
  upstream.on("error", () => {
    if (res.destroyed) return;
    if (!res.headersSent) res.status(502).json({ error: "API is unavailable" });
    else res.destroy();
  });
  req.on("aborted", () => upstream.destroy());
  req.on("error", () => upstream.destroy());
  res.on("close", () => {
    if (!res.writableFinished) upstream.destroy();
  });
  req.pipe(upstream);
});

let vite;
let template;
let productionRender;
if (production) {
  template = await readFile(path.join(root, "dist/client/index.html"), "utf8");
  productionRender = (await import("../dist/server/entry-server.js")).render;
  app.use(
    "/assets",
    express.static(path.join(root, "dist/client/assets"), {
      immutable: true,
      maxAge: "1y",
      fallthrough: false,
    }),
  );
  app.use(express.static(path.join(root, "dist/client"), { index: false }));
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
}

app.get("*", async (req, res) => {
  res.set("Cache-Control", "private, no-store");
  try {
    const render = production
      ? productionRender
      : (await vite.ssrLoadModule("/src/entry-server.jsx")).render;
    const result = await render(req.originalUrl, {
      apiOrigin,
      cookie: req.headers.cookie,
    });
    if (result.redirectTo) {
      res.redirect(result.status, result.redirectTo);
      return;
    }
    const pageTemplate = production
      ? template
      : await vite.transformIndexHtml(
          req.originalUrl,
          await readFile(path.join(root, "index.html"), "utf8"),
        );
    res
      .status(result.status)
      .type("html")
      .send(renderDocument(pageTemplate, result, result.initialData));
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    console.error(error);
    res
      .status(503)
      .type("html")
      .send(
        '<!doctype html><html lang="en"><head><title>Page unavailable</title></head><body><h1>Page temporarily unavailable</h1><p>Please try again shortly.</p></body></html>',
      );
  }
});

const server = app.listen(port, values.host, () => {
  console.log(
    `UI ${production ? "production" : "development"} server: http://${values.host}:${server.address().port}`,
  );
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
